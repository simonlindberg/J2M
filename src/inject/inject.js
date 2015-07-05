function toMarkdown(text) {
  text = text.replace(/^h([0-6])\.(.*)$/gm, function (match,level,content) {
    return Array(parseInt(level) + 1).join('#') + content;
  });

  text = text.replace(/([*_])(.*)\1/g, function (match,wrapper,content) {
    var to = (wrapper === '*') ? '**' : '*';
    return to + content + to;
  });


  text = text.replace(/\{\{([^\n}]+)\}\}/g, '`$1`');
  text = text.replace(/\?\?((?:.[^?]|[^?].)+)\?\?/g, '<cite>$1</cite>');
  text = text.replace(/\+([^+]*)\+/g, '<ins>$1</ins>');
  text = text.replace(/\^([^^]*)\^/g, '<sup>$1</sup>');
  text = text.replace(/~([^~]*)~/g, '<sub>$1</sub>');
  text = text.replace(/-([^-]*)-/g, '~~$1~~');

  text = text.replace(/\{code(:([a-z]+))?\}([^]*)\{code\}/gm, '```$2$3```');

  text = text.replace(/\[(.+?)\|(.+)\]/g, '[$1]($2)');
  text = text.replace(/\[(.+?)\]([^\(]*)/g, '<$1>$2');

  return text;
}

function toJiraStyle(text) {
  text = text.replace(/^(.*?)\n([=-])+$/gm, function (match,content,level) {
    return 'h' + (level[0] === '=' ? 1 : 2) + '. ' + content;
  });

  text = text.replace(/^([#]+)(.*?)$/gm, function (match,level,content) {
    return 'h' + level.length + '.' + content;
  });

  text = text.replace(/([*_]+)(.*?)\1/g, function (match,wrapper,content) {
    var to = (wrapper.length === 1) ? '_' : '*';
    return to + content + to;
  });

  var map = {
    cite: '??',
    del: '-',
    ins: '+',
    sup: '^',
    sub: '~'
  };

  text = text.replace(new RegExp('<(' + Object.keys(map).join('|') + ')>(.*?)<\/\\1>', 'g'), function (match,from,content) {
    console.log(from);
    var to = map[from];
    return to + content + to;
  });

  text = text.replace(/~~(.*?)~~/g, '-$1-');

  text = text.replace(/`{3,}(\w+)?((?:\n|[^`])+)`{3,}/g, function(match, synt, content) {
    var code = '{code';

    if (synt) {
      code += ':' + synt;
    }

    code += '}' + content + '{code}';

    return code;
  });

  text = text.replace(/`([^`\n]+)`/g, '{{$1}}');

  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$1|$2]');
  text = text.replace(/<([^>]+)>/g, '[$1]');

  return text;
}

chrome.extension.sendMessage({}, function(response) {
  var readyStateCheckInterval = setInterval(function() {
    clearInterval(readyStateCheckInterval);

    var observer = new MutationObserver(function(mutations, observer) {
      var jiraTextArea = document.querySelector('#comment');

      var markdownTextArea = document.createElement('textarea');
      markdownTextArea.className = jiraTextArea.className;
      markdownTextArea.attributes = jiraTextArea.attributes;
      markdownTextArea.id = jiraTextArea.id + "-markdown";


      var jiraToMarkdown = false;
      var markdownToJira = false;
      jiraTextArea.onfocus = function() {
        jiraToMarkdown = true;
        markdownToJira = false;
      }
      markdownTextArea.onfocus = function() {
        jiraToMarkdown = false;
        markdownToJira = true;
      }
      markdownTextArea.onblur = function() {
        jiraToMarkdown = false;
        markdownToJira = false;
      }
      jiraTextArea.onblur = markdownTextArea.onblur;

      
      jiraTextArea.onchange = function() {
        if (jiraToMarkdown) {
          console.log('JIRA:   ' + jiraTextArea.value);
          console.log('J -> M: ' + toMarkdown(jiraTextArea.value));
          markdownTextArea.value = toMarkdown(jiraTextArea.value);
        }
      }
      jiraTextArea.onkeyup = jiraTextArea.onchange;

      markdownTextArea.onchange = function() {
        if (markdownToJira) {
          console.log('MARKDOWN: ' + markdownTextArea.value);
          console.log('M -> J :  ' + toJiraStyle(markdownTextArea.value));
          jiraTextArea.value = toJiraStyle(markdownTextArea.value);
        }
      }
      markdownTextArea.onkeyup = markdownTextArea.onchange;

      var commentAreaContainer = document.querySelector('#comment-wiki-edit');
      commentAreaContainer.appendChild(markdownTextArea);


    });
    var config = { attributes: true, childList: true, characterData: true };
    //var config = /* @type {MutationObserverInit} */ ();
    // Find the div under which the comments textarea will be added.
    var targetDiv = document.querySelector('#addcomment');
    observer.observe(targetDiv, config);

    console.log("Observing: " + targetDiv);
  }, 10);
});