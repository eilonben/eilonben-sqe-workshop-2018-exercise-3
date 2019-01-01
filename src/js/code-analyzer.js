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
    return ''+finalResult +'\n'+ edges;
};

const isDeclOrAssign = (x) => isValDecl(x) || isExpression(x);
const isValDecl  = (x) => x.type === 'VariableDeclaration';
const isWhile = (x) => x.type === 'WhileStatement';
const isIf = (x) => x.type === 'IfStatement';
const isExpression = (x) => x.type === 'ExpressionStatement';

const parseProgram = (ast,params) => {
    let symbolTable = {};
    let i=0;
    let globals = 'global' + nodeCount + '=>operation: ('+nodeCount+')\n';
    while (isValDecl(ast.body[i])){
        globals+= parseValDecl(ast.body[i],symbolTable) + '\n';
        i++;
    }
    if (i>0){
        finalResult = globals+'| green\n';
        finalResult+='st=>start: Function\n';
        nodeCount++;
        edges='global1->st \n';
    }
    else {
        finalResult = 'st=>start: Function\n';
        edges = '';
    }
    parseFunc(ast.body[i],symbolTable,params,'st',true);
};


const parseDeclAssign = (exprBody,i,symbolTable,prev,green) => {
    let label ='';
    while(i<exprBody.length && (isDeclOrAssign(exprBody[i]))){
        if (isExpression(exprBody[i])){
            label+=parseAssignment(exprBody[i].expression,symbolTable) + '\n';
        }
        else
            label+=parseValDecl(exprBody[i],symbolTable) + '\n';
        i++;
    }
    if (green){
        label = label.substring(0,label.length-1) + '| green' +'\n';
    }
    let nodeName = 'oper' + nodeCount ;
    nodeCount++;
    edges += prev+'->'+nodeName+'\n';
    finalResult+= nodeName + '=>operation: ('+(nodeCount-1)+') \n' + label;
    return nodeName+','+i;
};

function parseBody(exprBody,symbolTable,prev,green,innerCond) {
    let lastNode =prev;
    let i =0;
    while (i<exprBody.length){
        if(isDeclOrAssign(exprBody[i])){
            let response = parseDeclAssign(exprBody,i,symbolTable,lastNode,green).split(',');
            lastNode = response[0];
            i=response[1];
        }
        else
        if (isIf(exprBody[i]) || isWhile(exprBody[i])){
            lastNode=parseCond(exprBody[i],symbolTable,lastNode,green,innerCond);
            i++;
        }
        else {
            lastNode = parseReturn(exprBody[i],symbolTable,lastNode);
            i++;}
    }
    return lastNode;
}

const parseCond = (condExpr,symbolTable,lastN,green,innerCond) => {
    if (isWhile(condExpr)){
        return parseWhile(condExpr,symbolTable,lastN,green,innerCond);
    }
    return parseIf(condExpr,symbolTable,lastN,green,innerCond);
};
const parseFunc = (funcAst,symbolTable,params,prev,green) => {
    let paramsArr = eval('[' + params + ']');
    let newTable  =Object.assign({},symbolTable);
    for (let i =0; i<paramsArr.length; i++){
        if (paramsArr[i].constructor === Array){
            newTable[funcAst.params[i].name] = esprima.parseScript('[' +paramsArr[i].toString() + ']').body[0].expression;
        }
        else
            newTable[funcAst.params[i].name] = esprima.parseScript(paramsArr[i].toString()).body[0].expression;
    }
    parseBody(funcAst.body.body,newTable,prev,green,false);
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
    let lhs = JSON.parse(JSON.stringify(expr.left));
    let rhs = JSON.parse(JSON.stringify(expr.right));
    let subRhs = substitute(rhs,symbolTable);
    if(lhs.type === 'MemberExpression'){
        let name = escodegen.generate(lhs);
        newTable[name] = subRhs;
    }
    else {
        newTable[lhs.name] = subRhs;
        symbolTable = Object.assign(symbolTable,newTable);}
    return escodegen.generate(expr);
};

const parseWhile = (expr,symbolTable,lastN,green,innerCond) => {
    let scope = Object.assign({},symbolTable);
    let tmp = substitute(JSON.parse(JSON.stringify(expr.test)),symbolTable);
    let whileGreen = eval(subTest(tmp, symbolTable));
    let nullNodeName = 'null' +nullCount;
    let whileTest = 'while'+nodeCount;
    nullCount++;
    nodeCount++;
    edges+=lastN + '->' + nullNodeName+'\n';
    edges+=nullNodeName + '->' + whileTest+'\n';
    if (green){
        finalResult+= whileTest+ '=>condition: ('+(nodeCount-1)+')\n'+escodegen.generate(expr.test) + '| green\n';
        finalResult+= nullNodeName+ '=>operation: NULL| green\n';
    }
    else {
        finalResult+= whileTest+ '=>condition: ('+(nodeCount-1)+')\n'+escodegen.generate(expr.test) +'\n';
        finalResult += nullNodeName + '=>operation: NULL\n';
    }
    return parseWhileBody(expr.body,scope,nullNodeName,whileTest,whileGreen && green,innerCond);
};

const parseWhileBody = (body,symbolTable,NullNode,whileTest,green,innerCond) => {
    let bodyEnd;
    if (body.type === 'BlockStatement'){
        bodyEnd = parseBody(body.body,symbolTable,whileTest+'(yes)',green,innerCond);
    }
    else
        bodyEnd = parseBody([body],symbolTable,whileTest+'(yes)',green,innerCond);
    edges+=bodyEnd+'->'+NullNode+'\n';
    return whileTest+'(no)';
};
const parseIf = (expr,symbolTable,lastN,green,innerCond) => {
    let scope = Object.assign({},symbolTable);
    let test = JSON.parse(JSON.stringify(expr.test));
    let tmp = substitute(test,symbolTable);
    let IfGreen = eval(escodegen.generate(tmp));
    let ifNode = 'if'+nodeCount;
    nodeCount++;
    edges+=lastN +'->' +ifNode+'\n';
    if(innerCond)
        nullCount=nullCount-1;
    let ifNull = 'ifNull'+nullCount;
    nullCount++;
    if (green){
        finalResult+=ifNode+'=>condition: ('+(nodeCount-1)+')\n'+escodegen.generate(expr.test)+ '| green\n';
        finalResult+=ifNull+'=>end: null| green\n';
    }
    else {
        finalResult += ifNode + '=>condition: ('+(nodeCount-1)+')\n' + escodegen.generate(expr.test)+'\n';
        finalResult += ifNull + '=>end: null\n';}
    return ifBodyHandler(expr, scope, ifNode,ifNull,IfGreen&&green,innerCond);};

const ifBodyHandler=(expr,symbolTable,ifNode,ifNull,green,innerCond) =>{
    // if (expr.consequent.type==='BlockStatement'){
    let  ifConsq =parseBody(expr.consequent.body,symbolTable,ifNode+'(yes)',green,true);
    // }
    // else
    //     ifConsq = parseBody([expr.consequent],symbolTable,ifNode+'(yes)',green,true);
    let ifAlt = altHandler(expr,symbolTable,ifNode+'(no)',!green);
    edges+=ifNode +'(yes)->'+ifConsq+'\n';
    edges+=ifConsq +'->'+ifNull+'\n';
    if(ifAlt) {
        edges += ifNode + '(no)->' + ifAlt + '\n';
        edges += ifAlt + '->' + ifNull + '\n';
    }
    else
        edges+=ifNode+'(no)->'+ifNull+'\n';
    if (innerCond)
        return ifNode;
    return ifNull;
};

const altHandler = (expr,symbolTable,ifNode,green) =>{
    let ifAlt;
    if (expr.alternate===null || expr.alternate ===undefined)
        ifAlt='';
    else{
        if (expr.alternate.type==='BlockStatement') {
            ifAlt = parseBody(expr.alternate.body, symbolTable, ifNode, green, true);
        }
        else
            ifAlt= parseBody([expr.alternate],symbolTable,ifNode,green,true);
    }
    return ifAlt;
};
const parseReturn = (retExp,symbolTable,lastN) => {
    let retName = 'return'+nodeCount;
    let retNode = retName+'=>operation: \t('+ nodeCount++ +')\n' +escodegen.generate(retExp);
    edges+=lastN+'->'+retName+'\n';
    // if (green)
    finalResult+=retNode+ '| green\n';
    // else
    //     finalResult+=retNode+'\n';
    return '';

};
const substitute = (expr,symbolTable) => {
    let expType = expr.type;
    if (expType === 'Identifier'){
        // if (symbolTable[expr.name]){
        return substitute(symbolTable[expr.name],symbolTable);
        // }
        // return expr;
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
    return escodegen.generate(substitute(expr,paramTable));
};
export {parseCode};
export {parseProgram};


