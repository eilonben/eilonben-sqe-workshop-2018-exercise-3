import * as esprima from 'esprima';
import * as escodegen from 'escodegen';



let testColors = {};
let testIndex= 0;
const parseCode = (codeToParse,params) => {
    let initialAst = esprima.parseScript(codeToParse);
    let finalAst = parseProgram(initialAst,params);
    return dyeCode(finalAst);

};
// const parseParams = (params) =>{
//     let newParams ={};
//     if (params.length === 0)
//         return newParams;
//     let newString =params;
//     if (params[0] ==='(')
//         newString = 'let ' + params.substring(1,params.length-1);
//     else
//         newString = 'let' + params;
//     let varDecl = esprima.parseScript(newString);
//     console.log(varDecl);
//     parseValDecl(varDecl.body[0],newParams);
//     console.log(newParams);
//     return newParams;
// }
const dyeCode = (parsedCode) => {
    let output = escodegen.generate(parsedCode);
    return output;
};

const isValDecl  = (x) => x.type === 'VariableDeclaration';
const isWhile = (x) => x.type === 'WhileStatement';
const isIf = (x) => x.type === 'IfStatement';
const isExpression = (x) => x.type === 'ExpressionStatement';
const isFunction = (x) => x.type === 'FunctionDeclaration';


const parseProgram = (ast,params) => {
    let symbolTable = {};
    ast.body = ast.body.map((expr) => parseExpr(expr,symbolTable,params));
    ast.body = ast.body.filter(expr => expr!=null);
    return ast;
};

const parseExpr = (singleExpr,symbolTable,paramTable) => {
    console.log('the table in parse is' + symbolTable);
    let output = {} ;
    isFunction(singleExpr) ? output = parseFunc(singleExpr,symbolTable,paramTable):
        isValDecl(singleExpr) | isExpression(singleExpr) ? output = parseDeclAssign(singleExpr,symbolTable,paramTable) :
            isWhile(singleExpr) ? output = parseWhile(singleExpr,symbolTable,paramTable) :
                isIf(singleExpr) ? output = parseIf(singleExpr,symbolTable,paramTable) :
                    output = parseReturn(singleExpr,symbolTable);
    return output;
};

const parseDeclAssign = (expr,symbolTable,paramTable) => {
    let output;
    isValDecl(expr) ? output = parseValDecl(expr,symbolTable) :
        output = parseAssignment(expr,symbolTable,paramTable);
    return output;
};

const parseBody = (exprBody,symbolTable,paramTable) => {
    if (exprBody === null || exprBody.type === 'EmptyStatement')
        return exprBody;
    if (exprBody.type === 'BlockStatement') {
        exprBody.body = exprBody.body.map((expr) => parseExpr(expr,symbolTable,paramTable)); // the body of the block statement
        exprBody.body = exprBody.body.filter(expr => expr!=null);
    }
    return exprBody;
};
const parseFunc = (funcAst,symbolTable,params) => {
    let paramsArr = eval('[' + params + ']');
    let paramTable ={};
    for (let i =0; i<paramsArr.length; i++){
        if (paramsArr[i].constructor === Array){
            paramTable[funcAst.params[i].name] = esprima.parseScript('[' +paramsArr[i].toString() + ']').body[0].expression;
        }
        else
            paramTable[funcAst.params[i].name] = esprima.parseScript(paramsArr[i].toString()).body[0].expression;
    }
    console.log(paramTable);
    funcAst.body = parseBody(funcAst.body,symbolTable,paramTable);
    return funcAst;
};

const parseValDecl = (decl,symbolTable) => {
    console.log(symbolTable);
    decl.declarations.forEach ( (varD) => {
        let id = varD.id.name;
        if (varD.init != null) {
            symbolTable[id] = varD.init;
        }
    });
    return null;
};

const parseAssignment = (expr,symbolTable,paramTable) => {
    let newTable = Object.assign({},symbolTable);
    let lhs = expr.expression.left;
    let rhs = expr.expression.right;
    let subRhs = substitute(rhs,symbolTable);
    if(lhs.type === 'MemberExpression'){
        let name = escodegen.generate(lhs);
        newTable[name] = subRhs;
    }
    else {
        if (paramTable[lhs.name]) {
            rhs = subRhs;
            newTable[lhs.name] = rhs;
            symbolTable = Object.assign(symbolTable,newTable);
            return expr;
        }
        newTable[lhs.name] = subRhs;
        symbolTable = Object.assign(symbolTable,newTable);}
    return null;
};


const parseWhile = (expr,symbolTable,paramTable) => {
    let scope = Object.assign({},symbolTable);
    expr.test = substitute(expr.test,symbolTable);
    // let testTable = Object.assign(paramTable,symbolTable);
    let testResult = eval(subTest(expr.test,paramTable));
    if (testResult)
        testColors[testIndex] = 'green';
    else
        testColors[testIndex] = 'red';
    testIndex++;
    expr.body = parseBody(expr.body,scope,paramTable);
    return expr;
};

const parseIf = (expr,symbolTable,paramTable) => {
    expr.test = substitute(expr.test, symbolTable);
    let testResult = eval(subTest(expr.test, paramTable));
    if (testResult)
        testColors[testIndex] = 'green';
    else
        testColors[testIndex] = 'red';
    testIndex++;
    return ifHandler(expr, symbolTable, paramTable);
};

const ifHandler =(expr,symbolTable,paramTable) => {
    let scope = Object.assign({},symbolTable);
    if(expr.consequent.type === 'BlockStatement')
        expr.consequent = parseBody(expr.consequent,scope,paramTable);
    else
        expr.consequent = parseExpr(expr.consequent,symbolTable,paramTable);
    if (expr.alternate === null || expr.alternate === undefined)
        return expr;
    scope = Object.assign({},symbolTable);
    if(expr.alternate.type === 'BlockStatement')
        expr.alternate = parseBody(expr.alternate,scope,paramTable);
    else
        expr.alternate = parseExpr(expr.alternate,symbolTable,paramTable);
    return expr;
};


const parseReturn = (retExp,symbolTable) => {
    retExp.argument = substitute(retExp.argument,symbolTable)
    return retExp;
};

const substitute = (expr,symbolTable) => {
    let expType = expr.type;
    if (expType === 'Identifier'){
        if (symbolTable[expr.name]){
            return substitute(symbolTable[expr.name],symbolTable);
        }
        return expr;
    }
    else if (expType === 'UnaryExpression') {
        expr.argument = substitute(expr.argument, symbolTable);
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
        console.log(expr);
        if(expr.object.type !== 'Identifier'){
            expr = esprima.parseScript(escodegen.generate(expr)).body[0].expression;
        }


    }
    return expr;
};

const subTest = (expr,paramTable) => {
    let tmpExp =escodegen.generate(expr);
    let toSub = esprima.parseScript(tmpExp).body[0].expression;
    return escodegen.generate(substitute(toSub,paramTable));
}
export {parseCode};

