import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

let nodeCount;
let nullCount;
let finalResult;
let edges;

const parseCode = (codeToParse,params) => {
    nullCount =1;
    nodeCount=1;
    finalResult ='';
    edges = '';
    let initialAst = esprima.parseScript(codeToParse);
    parseProgram(initialAst,params);
    return ''+finalResult + edges;
};

const isDeclOrAssign = (x) => isValDecl(x) || isExpression(x);
const isValDecl  = (x) => x.type === 'VariableDeclaration';
const isWhile = (x) => x.type === 'WhileStatement';
const isIf = (x) => x.type === 'IfStatement';
const isExpression = (x) => x.type === 'ExpressionStatement';

const parseProgram = (ast,params) => {
    let symbolTable = {};
    let i=0;
    finalResult = 'global' + nodeCount + '=>operation: ('+nodeCount+') \n';
    let resLengh = finalResult.length;
    while (isValDecl(ast.body[i])){
        finalResult+= parseValDecl(ast.body[i],symbolTable) + '\n';
        i++;
    }
    finalResult+='st=>start: Function\n';
    if (resLengh !== finalResult.length){
        nodeCount++;
        edges='global1->st \n';
    }
    else
        edges = '';
    parseFunc(ast.body[i],symbolTable,params,'st');
};


const parseDeclAssign = (exprBody,i,symbolTable,prev,green) => {
    let label ='';
    while(i<exprBody.length && (isDeclOrAssign(exprBody[i]))){
        if (isExpression(exprBody[i])){
            label+=parseAssignment(exprBody[i].expression,symbolTable) + '\n';
        }
        else
            label+=parseValDecl(exprBody[i],symbolTable) + '\n';
    }
    if (green){
        label = label.substring(0,label.length-1) + '| green' +'\n';
    }
    let nodeName = 'oper' + nodeCount ;
    nodeCount++;
    edges += prev+'->'+nodeName;
    finalResult+= nodeName + '=>operation: ('+nodeCount+') \n' + label;
    return nodeName;
};

function parseBody(exprBody,symbolTable,prev,green) {
    let lastNode =prev;
    let i =0;
    while (i<exprBody.length){
        if(isDeclOrAssign(exprBody[i])){
            lastNode = parseDeclAssign(exprBody,i,symbolTable,lastNode,green);
        }
        else
        if (isIf(exprBody[i]) || isWhile(exprBody[i])){
            lastNode=parseCond(exprBody[i],symbolTable,lastNode,green);
            i++;
        }
        else {
            lastNode = parseReturn(exprBody[i],symbolTable,lastNode,green);
            i++;
        }
    }
    return lastNode;
}

const parseCond = (condExpr,symbolTable,lastN,green) => {
    if (isWhile(condExpr)){
        return parseWhile(condExpr,symbolTable,lastN,green);
    }
    return parseIf(condExpr,symbolTable,lastN,green);
};
const parseFunc = (funcAst,symbolTable,params,prev) => {
    let paramsArr = eval('[' + params + ']');
    let newTable  =Object.assign({},symbolTable);
    for (let i =0; i<paramsArr.length; i++){
        if (paramsArr[i].constructor === Array){
            newTable[funcAst.params[i].name] = esprima.parseScript('[' +paramsArr[i].toString() + ']').body[0].expression;
        }
        else
            newTable[funcAst.params[i].name] = esprima.parseScript(paramsArr[i].toString()).body[0].expression;
    }
    parseBody(funcAst.body.body,symbolTable,prev);
};

const parseValDecl = (decl,symbolTable) => {
    decl.declarations.forEach ( (varD) => {
        let id = varD.id.name;
        if (varD.init != null) {
            symbolTable[id] = varD.init;
        }
    });
    return escodegen.generate(decl);
};

const parseAssignment = (expr,symbolTable) => {
    let newTable = Object.assign({},symbolTable);
    let lhs = expr.expression.left;
    let rhs = expr.expression.right;
    let subRhs = substitute(rhs,symbolTable);
    if(lhs.type === 'MemberExpression'){
        let name = escodegen.generate(lhs);
        newTable[name] = subRhs;
    }
    else {
        newTable[lhs.name] = subRhs;
        symbolTable = Object.assign(symbolTable,newTable);}
    return escodegen.generate(expr.expression);
};

const parseWhile = (expr,symbolTable,lastN,green) => {
    let scope = Object.assign({},symbolTable);
    let tmpExpr = escodegen.generate(esprima.parseScript(expr).body[0].expression);
    tmpExpr.test = substitute(tmpExpr.test,symbolTable);
    let whileGreen = eval(subTest(tmpExpr.test,symbolTable));
    let nullNodeName = 'null' +nullCount++;
    let whileTest = 'while'+nodeCount++;
    edges+=lastN + '->' + nullNodeName+'\n';
    edges+=nullNodeName + '->' + whileTest+'\n';
    if (green){
        finalResult+= whileTest+ '=>condition: ('+nodeCount-1+')\n'+escodegen.generate(expr.test) + '| green\n';
        finalResult+= nullNodeName+ '=>operation: NULL| green\n';
    }
    else {
        finalResult+= whileTest+ '=>condition: ('+nodeCount-1+')\n'+escodegen.generate(expr.test);
        finalResult += nullNodeName + '=>operation: NULL\n';
    }
    return parseWhileBody(expr.body,scope,nullNodeName,whileTest,whileGreen);
};

const parseWhileBody = (body,symbolTable,NullNode,whileTest,green) => {
    let bodyEnd;
    if (body.type === 'BlockStatement'){
        bodyEnd = parseBody(body.body,symbolTable,whileTest+'(yes)',green);
    }
    else
        bodyEnd = parseBody([body],symbolTable,whileTest+'(yes)',green);
    edges+=bodyEnd+'->'+NullNode+'\n';
    return whileTest+'(no)';
};
const parseIf = (expr,symbolTable,lastN,green) => {
    let scope = Object.assign({},symbolTable);
    let tmpExpr = escodegen.generate(esprima.parseScript(expr).body[0].expression);
    tmpExpr.test = substitute(tmpExpr.test,symbolTable);
    let IfGreen = eval(subTest(expr.test, symbolTable));
    let ifNode = 'if'+nodeCount++;
    edges+=lastN +'->' +ifNode+'\n';
    let ifNull = 'ifNull'+nullCount++;
    if (green){
        finalResult+=ifNode+'=>condition: ('+nodeCount-1+')\n'+escodegen.generate(expr.test)+ '| green\n';
        finalResult+=ifNull+'=>end: null| green\n';
    }
    else {
        finalResult += ifNode + '=>condition: ('+nodeCount-1+')\n' + escodegen.generate(expr.test);
        finalResult += ifNull + '=>end: null';
    }
    return ifBodyHandler(expr, scope, ifNode,ifNull,IfGreen);
};

const ifBodyHandler=(expr,symbolTable,ifNode,ifNull,green) =>{
    let ifConsq;

    if (expr.consequent.type==='BlockStatement'){
        ifConsq= parseBody(expr.consequent.body.body,symbolTable,ifNode+'(yes)',green);
    }
    else
        ifConsq= parseBody([expr.consequent.body],symbolTable,ifNode+'(yes)',green);
    let ifAlt = altHandler(expr,symbolTable,ifNode+'(no)',green);
    edges+=ifNode +'(yes)->'+ifConsq;
    if(ifAlt)
        edges+=ifNode+'(no)->'+ifAlt;
    else
        edges+=ifNode+'(no)->'+ifNull;
    return ifNull;
};

const altHandler = (expr,symbolTable,ifNode,green) =>{
    let ifAlt;
    if (expr.alternate===null || expr.alternate ===undefined)
        ifAlt='';
    else{
        if (expr.alternate.type==='BlockStatement'){
            ifAlt= parseBody(expr.alternate.body.body,symbolTable,ifNode,green);
        }
        else
            ifAlt= parseBody([expr.alternate.body],symbolTable,ifNode,green);
    }
    return ifAlt;
};
const parseReturn = (retExp,symbolTable,lastN,green) => {
    let retName = 'return'+nodeCount;
    let retNode = retName+'=>operation: ('+ nodeCount++ +')\n' +escodegen.generate(retExp);
    edges+=lastN+'->'+retName;
    if (green)
        finalResult+=retNode+ '| green\n';
    else
        finalResult+=retNode+'\n';
    return '';

};
const substitute = (expr,symbolTable) => {
    let expType = expr.type;
    if (expType === 'Identifier'){
        if (symbolTable[expr.name]){
            return substitute(symbolTable[expr.name],symbolTable);
        }
        return expr;
    }
    else
        return otherSubs(expr,symbolTable);
};
const otherSubs = (expr,symbolTable) => {
    let expType = expr.type;
    if (expType === 'BinaryExpression'){
        expr.left = substitute(expr.left,symbolTable);
        expr.right = substitute(expr.right,symbolTable);
    }
    else if (expType === 'ArrayExpression'){
        expr.elements = expr.elements.map ( (element) => substitute(element,symbolTable));
    }
    else if (expType === 'MemberExpression'){// member expression
        expr.object = substitute(expr.object, symbolTable);
        expr.property = substitute(expr.property, symbolTable);
    }
    return expr;
};
const subTest = (expr,paramTable) => {
    let tmpExp =escodegen.generate(expr);
    let toSub = esprima.parseScript(tmpExp).body[0].expression;
    return escodegen.generate(substitute(toSub,paramTable));
};
export {parseCode};
export {parseProgram};


