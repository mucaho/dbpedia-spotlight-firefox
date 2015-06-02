var self = require("sdk/self");
var Request = require("sdk/request").Request;
var selection = require("sdk/selection");

var panel = require("sdk/panel").Panel({
  width: 400,
  height: 300,
  onHide: function() {
    panel.contentURL = "./undefined";
    panel.contentURL = "./panel.html";
  },
  contentURL: "./panel.html",
  contentScript: "self.port.on('replace', function onShow(data) {" +
                 "  document.body.innerHTML = data;" +
                 "});" +
                 "self.port.on('append', function onShow(data) {" +
                 "  var body = document.body;" +
                 "  var newcontent = document.createElement('div');" +
                 "  newcontent.innerHTML = data;" +
                 "  while (newcontent.firstChild)" +
                 "    body.appendChild(newcontent.firstChild);" +
                 "});"
});



function Item (label, inputCB, outputCB) {
  return {
    label: label + "Annotate using DBPedia Spotlight...",
    context: cm.SelectionContext(),
    image: self.data.url("icon-16.png"),
    contentScript: "self.on('click', function (node, data) {" +
                   "  self.postMessage(node.textContent);" +
                   "});",
    onMessage: function (text) {
      if (selection.isContiguous) {
        annotate(selection, inputCB, outputCB);
      } else {
        for (var subselection in selection) {
           annotate(subselection, inputCB, outputCB);
        }
      }
    }
  };
}


function annotate (selection, inputCB, outputCB) {
  Request({
    url: "http://spotlight.dbpedia.org/rest/annotate",
    content: {
      text: inputCB(selection)
    },
    headers: {
      "Accept": "application/xhtml+xml"
    },
    onComplete: function (response) {
      if (response.status === 200)
        outputCB(selection, response.text);
    }
  }).post();
}



var cm = require("sdk/context-menu");
/***********************
 * IN-PLACE ANNOTATION *
 ***********************/
cm.Item(Item("", function (selection) {
    return selection.html;
}, function (selection, text) {
    if (selection.text)
      selection.html = text
}));
/**********************
 * POPUP ANNOTATION   *
 **********************/
cm.Item(Item("(Popup) ", function (selection) {
    return selection.text;
}, function (selection, text) {
    panel.port.emit("append", text);
    panel.show();
}));