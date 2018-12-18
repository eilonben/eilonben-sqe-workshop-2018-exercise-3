import assert from 'assert';
import * as escodegen from 'escodegen';
import * as esprima from 'esprima';
import {refactorCode} from '../src/js/code-analyzer';
import {parseProgram} from '../src/js/code-analyzer';
import {dyeCode} from '../src/js/code-analyzer';
import {parseCode} from '../src/js/code-analyzer';

describe('Simple tests', () => {
    it('- test function only', () => {
        assert.equal(escodegen.generate(parseProgram(esprima.parseScript('function foo(x) {\n' +
            'return x;\n' +
            '}\n'),'1')),'function foo(x) {\n' +
            '    return x;\n' +
            '}');
    });

    it('-test function with multiple args', () => {
        assert.equal(escodegen.generate(parseProgram(esprima.parseScript('function foo(x,y) {\n' +
            'return x;\n' +
            '}\n'),'1,2')),'function foo(x, y) {\n' +
            '    return x;\n' +
            '}');
    });
    it('- test function with array arg', () => {
        assert.equal(escodegen.generate(parseProgram(esprima.parseScript('function foo(x,y) {\n' +
            'return x;\n' +
            '}\n'), '1,[1,2,3]')), 'function foo(x, y) {\n' +
            '    return x;\n' +
            '}');
    });
});
describe('Tests with local param', () => {
    it('- test simple', () => {
        assert.equal(escodegen.generate(parseProgram(esprima.parseScript('function foo(x,y) {\n' +
            'let g = 3;\n' +
            'return x+g;\n' +
            '}'), '1,[1,2,3]')), 'function foo(x, y) {\n' +
            '    return x + 3;\n' +
            '}');
    });
    it('- test complex', () => {
        assert.equal(refactorCode(parseProgram(esprima.parseScript('function foo(x,y) {\n' +
            'let g = 3;\n' +
            'let a = [1,2,3];\n' +
            'return x+g+a[0];\n' +
            '}\n'), '1,[1,2,3]')), 'function foo(x, y) {\n' +
            '    return x + 3 + [1,2,3][0];\n' +
            '}');
    });
});

let ifSimple = 'function foo(x,y) {\n' +
    'let g = 3;\n' +
    'let a = [1,2,3];\n' +
    'if(g+a[0] < 6) {\n' +
    'return x+g+a[0];}\n' +
    'else\n' +
    'return x;\n' +
    '}';
let ifComplex = 'let b = 8\n' +
    'function foo(x,y) {\n' +
    'let g = 3;\n' +
    'let a = [1,2,3];\n' +
    'if(g+a[0] < 6) {\n' +
    'return x+g+a[0];}\n' +
    'else\n' +
    'b = b + 1\n' +
    'return b;\n' +
    '}\n';
describe('Tests with if', () => {
    it('- test simple', () => {
        assert.equal(refactorCode(parseProgram(esprima.parseScript(ifSimple), '1,[1,2,3]')),'function foo(x, y) {\n' +
            '    if (3 + [1,2,3][0] < 6) {\n' +
            '        return x + 3 + [1,2,3][0];\n' +
            '    } else\n' +
            '        return x;\n' +
            '}');
    });
    it('- test complex', () => {
        assert.equal(refactorCode(parseProgram(esprima.parseScript(ifComplex), '1,[1,2,3]')),'function foo(x, y) {\n' +
            '    if (3 + [1,2,3][0] < 6) {\n' +
            '        return x + 3 + [1,2,3][0];\n' +
            '    }\n' +
            '    return 8 + 1;\n' +
            '}');
    });
});
let whileSimple =
    'let b = 8\n' +
    'function foo(x,y) {\n' +
    'let g = 3;\n' +
    'let a = [1,2,3];\n' +
    'while(g+a[0] < 6) {\n' +
    'return x+g+a[0];}\n' +
    'b = b + 1\n' +
    'return b;\n' +
    '}';

let classExample1 = 'function foo(x, y, z){\n' +
    '    let a = x + 1;\n' +
    '    let b = a + y;\n' +
    '    let c = 0;\n' +
    '    \n' +
    '    if (b < z) {\n' +
    '        c = c + 5;\n' +
    '        return x + y + z + c;\n' +
    '    } else if (b < z * 2) {\n' +
    '        c = c + x + 5;\n' +
    '        return x + y + z + c;\n' +
    '    } else {\n' +
    '        c = c + z + 5;\n' +
    '        return x + y + z + c;\n' +
    '    }\n' +
    '}\n';

let classExample2 = 'function foo(x, y, z){\n' +
    '    let a = x + 1;\n' +
    '    let b = a + y;\n' +
    '    let c = 0;\n' +
    '    \n' +
    '    while (a < z) {\n' +
    '        c = a + b;\n' +
    '        z = c * 2;\n' +
    '    }\n' +
    '    \n' +
    '    return z;\n' +
    '}\n';

let classExample2complex = 'let g = 12;\n' +
    'let o;\n' +
    'let arr = [1,2,3]\n' +
    'function foo(x, y, z){\n' +
    '    let a = x + 1;\n' +
    '    let b = a + y;\n' +
    '    let c = 0;\n' +
    '    \n' +
    '    while (a > z) \n' +
    '        c = a + b;\n' +
    '\n' +
    '    if (a<z){\n' +
    '    c = arr[2]\n' +
    'arr[2] = x\n' +
    '    return c+z;\n' +
    '}\n' +
    '    return c +arr[2];\n' +
    '}\n';
describe('Last Tests', () => {
    it('- test simple', () => {
        assert.equal(refactorCode(parseProgram(esprima.parseScript(whileSimple), '1,[1,2,3]')),'function foo(x, y) {\n' +
            '    while (3 + [1,2,3][0] < 6) {\n' +
            '        return x + 3 + [1,2,3][0];\n' +
            '    }\n' +
            '    return 8 + 1;\n' +
            '}');
    });
    it('- test class example 1', () => {
        assert.equal(dyeCode(refactorCode(parseProgram(esprima.parseScript(classExample1),'1,2,3'))),'<pre>\n' +
            'function foo(x, y, z) {\n' +
            '<span style="background-color:red;">     if (x + 1 + y < z </span>\n' +
            '        return x + y + z + (0 + 5);\n' +
            '<span style="background-color:green;">     } else if (x + 1 + y < z * 2 </span>\n' +
            '        return x + y + z + (0 + x + 5);\n' +
            '    } else {\n' +
            '        return x + y + z + (0 + z + 5);\n' +
            '    }\n' +
            '}</pre>');
    });

    it('- test class example 2', () => {
        assert.equal(dyeCode(refactorCode(parseProgram(esprima.parseScript(classExample2),'1,2,3'))),'<pre>\n' +
            'function foo(x, y, z) {\n' +
            '<span style="background-color:green;">     while (x + 1 < z </span>\n' +
            '        z = (x + 1 + (x + 1 + y)) * 2;\n' +
            '    }\n' +
            '    return z;\n' +
            '}</pre>');
    });

    it('- test class example 2 complex', () => {
        assert.equal(parseCode(classExample2complex,'1,2,3'),'<pre>\n' +
            'function foo(x, y, z) {\n' +
            '<span style="background-color:red;">     while (x + 1 > z </span>\n' +
            '        c = a + b;\n' +
            '<span style="background-color:green;">     if (x + 1 < z </span>\n' +
            '        return [1,2,3][2] + z;\n' +
            '    }\n' +
            '    return 0 + [1,2,3][2];\n' +
            '}</pre>');
    });
});




