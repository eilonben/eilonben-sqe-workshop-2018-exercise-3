import $ from 'jquery';
import {parseCode} from './code-analyzer';
var flowchart = require('flowchart.js');
const stats =  {
    'x': 0,
    'y': 0,
    'line-width': 3,
    'line-length': 50,
    'text-margin': 10,
    'font-size': 14,
    'font-color': 'black',
    'line-color': 'black',
    'element-color': 'black',
    'fill': 'white',
    'yes-text': 'T',
    'no-text': 'F',
    'arrow-end': 'block',
    'scale': 1,
    // style symbol types
    'symbols': {
        'start': {
            'font-color': 'red',
            'element-color': 'green',
            'fill': 'yellow'
        },
        'end':{
            'class': 'end-element'
        }
    },
    // even flowstate support ;-)
    'flowstate' : {
        'past' : { 'fill' : '#CCCCCC', 'font-size' : 12},
        'current' : {'fill' : 'yellow', 'font-color' : 'red', 'font-weight' : 'bold'},
        'green' : { 'fill' : '#58C4A3', 'font-size' : 12},
    }
};
$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let params = $('#paramsPlaceHolder').val();
        let graph = parseCode(codeToParse,params);
        let diagram = flowchart.parse(graph);
        diagram.drawSVG('diagram',stats);
    });
});
