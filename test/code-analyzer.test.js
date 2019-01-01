import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';

let input = ['function foo(x){\n' +
'return x;}', //TODO
'let g =3;\n' +
'function foo(x){\n' +
'return x;}', // TODO
'let g =3;\n' +
'function foo(x){\n' +
'let a = [1,2,3]\n' +
'let b=a[1];\n' +
'return x;}',// TODO
'let g =3;\n' +
'function foo(x){\n' +
'if(x>3){\n' +
'let a=5;\n' +
'}\n' +
'return x;}',//TODO
'let g =3;\n' +
'function foo(x){\n' +
'if(x>3){\n' +
'let a=5;\n' +
'}\n' +
'else{\n' +
'let q =4;\n' +
'}\n' +
'return x;}',//TODO
'function foo(x, y, z){\n' +
'    let a = x + 1;\n' +
'    let b = a + y;\n' +
'    let c = 0;\n' +
'    \n' +
'    if (b < z) {\n' +
'        c = c + 5;\n' +
'    } else if (b < z * 2) {\n' +
'        c = c + x + 5;\n' +
'    } else {\n' +
'        c = c + z + 5;\n' +
'    }\n' +
'    \n' +
'    return c;\n' +
'}\n',//TODO
'function foo(x, y, z){\n' +
'   let a = x + 1;\n' +
'   let b = a + y;\n' +
'   let c = 0;\n' +
'   \n' +
'   while (a < z) {\n' +
'       c = a + b;\n' +
'       z = c * 2;\n' +
'       a = a+1;\n' +
'   }\n' +
'   \n' +
'   return z;\n' +
'}\n', //TODO
'function foo(x, y, z){\n' +
'    let a = x + 1;\n' +
'    let b = a + y;\n' +
'    let c = 0;\n' +
'    \n' +
'    if (b < z) {\n' +
'        c = c + 5;\n' +
'    } else if (b < z * 2) {\n' +
'        c = c + x + 5;\n' +
'    } else {\n' +
'        c = c + z + 5;\n' +
'   while (a < z) {\n' +
'       c = a + b;\n' +
'       z = c * 2;\n' +
'       a = a+1;\n' +
'   }\n' +
'   \n' +
'    }\n' +
'    \n' +
'    return c;\n' +
'}\n',//TODO
'let g;\n' +
'function foo(x,y,z){\n' +
'let a=[1,2,3];\n' +
'if (a[1]<y){\n' +
'g= a[1];\n' +
'}\n' +
'\n' +
'return a[2];}',//TODO
'let g;\n' +
'function foo(x,y,z){\n' +
'let a=[1,2,3];\n' +
'a[1]=6;\n' +
'while(a[1]<7)\n' +
'a[1]=a[1]+1;\n' +
'if(5>6){\n' +
'if(3<2){\n' +
'let c;}\n' +
'}\n' +
'return a[2];}'
];




let actual=['st=>start: Function\n' +
'return1=>operation: \t(1)\n' +
'return x;| green\n' +
'\n' +
'st->return1\n', //TODO
'global1=>operation: (1)\n' +
'let g = 3;\n' +
'| green\n' +
'st=>start: Function\n' +
'return2=>operation: \t(2)\n' +
'return x;| green\n' +
'\n' +
'global1->st \n' +
'st->return2\n', //TODO
'global1=>operation: (1)\n' +
'let g = 3;\n' +
'| green\n' +
'st=>start: Function\n' +
'oper2=>operation: (2) \n' +
'let a = [\n' +
'    1,\n' +
'    2,\n' +
'    3\n' +
'];\n' +
'let b = a[1];| green\n' +
'return3=>operation: \t(3)\n' +
'return x;| green\n' +
'\n' +
'global1->st \n' +
'st->oper2\n' +
'oper2->return3\n',//TODO
'global1=>operation: (1)\n' +
'let g = 3;\n' +
'| green\n' +
'st=>start: Function\n' +
'if2=>condition: (2)\n' +
'x > 3| green\n' +
'ifNull1=>end: null| green\n' +
'oper3=>operation: (3) \n' +
'let a = 5;\n' +
'return4=>operation: \t(4)\n' +
'return x;| green\n' +
'\n' +
'global1->st \n' +
'st->if2\n' +
'if2(yes)->oper3\n' +
'if2(yes)->oper3\n' +
'oper3->ifNull1\n' +
'if2(no)->ifNull1\n' +
'ifNull1->return4\n',//TODO
'global1=>operation: (1)\n' +
'let g = 3;\n' +
'| green\n' +
'st=>start: Function\n' +
'if2=>condition: (2)\n' +
'x > 3| green\n' +
'ifNull1=>end: null| green\n' +
'oper3=>operation: (3) \n' +
'let a = 5;\n' +
'oper4=>operation: (4) \n' +
'let q = 4;| green\n' +
'return5=>operation: \t(5)\n' +
'return x;| green\n' +
'\n' +
'global1->st \n' +
'st->if2\n' +
'if2(yes)->oper3\n' +
'if2(no)->oper4\n' +
'if2(yes)->oper3\n' +
'oper3->ifNull1\n' +
'if2(no)->oper4\n' +
'oper4->ifNull1\n' +
'ifNull1->return5\n',//TODO
'st=>start: Function\n' +
'oper1=>operation: (1) \n' +
'let a = x + 1;\n' +
'let b = a + y;\n' +
'let c = 0;| green\n' +
'if2=>condition: (2)\n' +
'b < z| green\n' +
'ifNull1=>end: null| green\n' +
'oper3=>operation: (3) \n' +
'c = c + 5\n' +
'if4=>condition: (4)\n' +
'b < z * 2| green\n' +
'ifNull1=>end: null| green\n' +
'oper5=>operation: (5) \n' +
'c = c + x + 5| green\n' +
'oper6=>operation: (6) \n' +
'c = c + z + 5\n' +
'return7=>operation: \t(7)\n' +
'return c;| green\n' +
'\n' +
'st->oper1\n' +
'oper1->if2\n' +
'if2(yes)->oper3\n' +
'if2(no)->if4\n' +
'if4(yes)->oper5\n' +
'if4(no)->oper6\n' +
'if4(yes)->oper5\n' +
'oper5->ifNull1\n' +
'if4(no)->oper6\n' +
'oper6->ifNull1\n' +
'if2(yes)->oper3\n' +
'oper3->ifNull1\n' +
'if2(no)->if4\n' +
'if4->ifNull1\n' +
'ifNull1->return7\n',//TODO
'st=>start: Function\n' +
'oper1=>operation: (1) \n' +
'let a = x + 1;\n' +
'let b = a + y;\n' +
'let c = 0;| green\n' +
'while2=>condition: (2)\n' +
'a < z| green\n' +
'null1=>operation: NULL| green\n' +
'oper3=>operation: (3) \n' +
'c = a + b\n' +
'z = c * 2\n' +
'a = a + 1| green\n' +
'return4=>operation: \t(4)\n' +
'return z;| green\n' +
'\n' +
'st->oper1\n' +
'oper1->null1\n' +
'null1->while2\n' +
'while2(yes)->oper3\n' +
'oper3->null1\n' +
'while2(no)->return4\n',//TODO
'st=>start: Function\n' +
'oper1=>operation: (1) \n' +
'let a = x + 1;\n' +
'let b = a + y;\n' +
'let c = 0;| green\n' +
'if2=>condition: (2)\n' +
'b < z| green\n' +
'ifNull1=>end: null| green\n' +
'oper3=>operation: (3) \n' +
'c = c + 5\n' +
'if4=>condition: (4)\n' +
'b < z * 2| green\n' +
'ifNull1=>end: null| green\n' +
'oper5=>operation: (5) \n' +
'c = c + x + 5| green\n' +
'oper6=>operation: (6) \n' +
'c = c + z + 5\n' +
'while7=>condition: (7)\n' +
'a < z\n' +
'null2=>operation: NULL\n' +
'oper8=>operation: (8) \n' +
'c = a + b\n' +
'z = c * 2\n' +
'a = a + 1\n' +
'return9=>operation: \t(9)\n' +
'return c;| green\n' +
'\n' +
'st->oper1\n' +
'oper1->if2\n' +
'if2(yes)->oper3\n' +
'if2(no)->if4\n' +
'if4(yes)->oper5\n' +
'if4(no)->oper6\n' +
'oper6->null2\n' +
'null2->while7\n' +
'while7(yes)->oper8\n' +
'oper8->null2\n' +
'if4(yes)->oper5\n' +
'oper5->ifNull1\n' +
'if4(no)->while7(no)\n' +
'while7(no)->ifNull1\n' +
'if2(yes)->oper3\n' +
'oper3->ifNull1\n' +
'if2(no)->if4\n' +
'if4->ifNull1\n' +
'ifNull1->return9\n',//TODO
'global1=>operation: (1)\n' +
'let g;\n' +
'| green\n' +
'st=>start: Function\n' +
'oper2=>operation: (2) \n' +
'let a = [\n' +
'    1,\n' +
'    2,\n' +
'    3\n' +
'];| green\n' +
'if3=>condition: (3)\n' +
'a[1] < y| green\n' +
'ifNull1=>end: null| green\n' +
'oper4=>operation: (4) \n' +
'g = a[1]\n' +
'return5=>operation: \t(5)\n' +
'return a[2];| green\n' +
'\n' +
'global1->st \n' +
'st->oper2\n' +
'oper2->if3\n' +
'if3(yes)->oper4\n' +
'if3(yes)->oper4\n' +
'oper4->ifNull1\n' +
'if3(no)->ifNull1\n' +
'ifNull1->return5\n',//TODO
'global1=>operation: (1)\n' +
'let g;\n' +
'| green\n' +
'st=>start: Function\n' +
'oper2=>operation: (2) \n' +
'let a = [\n' +
'    1,\n' +
'    2,\n' +
'    3\n' +
'];\n' +
'a[1] = 6| green\n' +
'while3=>condition: (3)\n' +
'a[1] < 7| green\n' +
'null1=>operation: NULL| green\n' +
'oper4=>operation: (4) \n' +
'a[1] = a[1] + 1| green\n' +
'if5=>condition: (5)\n' +
'5 > 6| green\n' +
'ifNull2=>end: null| green\n' +
'if6=>condition: (6)\n' +
'3 < 2\n' +
'ifNull2=>end: null\n' +
'oper7=>operation: (7) \n' +
'let c;\n' +
'return8=>operation: \t(8)\n' +
'return a[2];| green\n' +
'\n' +
'global1->st \n' +
'st->oper2\n' +
'oper2->null1\n' +
'null1->while3\n' +
'while3(yes)->oper4\n' +
'oper4->null1\n' +
'while3(no)->if5\n' +
'if5(yes)->if6\n' +
'if6(yes)->oper7\n' +
'if6(yes)->oper7\n' +
'oper7->ifNull2\n' +
'if6(no)->ifNull2\n' +
'if5(yes)->if6\n' +
'if6->ifNull2\n' +
'if5(no)->ifNull2\n' +
'ifNull2->return8\n'
];
describe('CFG graph generator Tests', () => {
    it('simple', () => {
        assert.equal((parseCode(input[0],'1')),
            actual[0]);
    });
    it('with globals', () => {
        assert.equal((parseCode(input[1],'1')),
            actual[1]);
    });
    it('array+member', () => {
        assert.equal((parseCode(input[2],'[1,2]')),
            actual[2]);
    });
    it('simple if', () => {
        assert.equal((parseCode(input[3],'1')),
            actual[3]);
    });
    it('simple if else and while', () => {
        assert.equal((parseCode(input[4],'1')),
            actual[4]);
    });
    it('class example 1', () => {
        assert.equal((parseCode(input[5],'1,2,3')),
            actual[5]);
    });
    it('class example 2', () => {
        assert.equal((parseCode(input[6],'1,2,3')),
            actual[6]);
    });
    it('class example combined 1', () => {
        assert.equal((parseCode(input[7],'1,2,3')),
            actual[7]);
    });
    it('coverage 1', () => {
        assert.equal((parseCode(input[8],'1,2,3')),
            actual[8]);
    });
    it('coverage 2', () => {
        assert.equal((parseCode(input[9],'1,2,3')),
            actual[9]);
    });
});
