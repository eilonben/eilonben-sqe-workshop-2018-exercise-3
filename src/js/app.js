import $ from 'jquery';
import {parseCode} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let params = $('#paramsPlaceHolder').val();
        console.log(params);
        $('#parsedCode').html(parseCode(codeToParse,params));
    });
});
