((function (App) {
  'use strict';

  App.Router.FrontOpenContent = Backbone.Router.extend({

    routes: {
      '(/)': 'index'
    },

    initialize: function () {
      // Instantiate the common views here for the page, use the "routes" object to instantiate
      // per route views
      new App.View.HeaderView({
        el: document.querySelector('.js-header')
      });

      // We instantiate the wysiwyg editor
      var content = document.querySelector('.js-json-content');
      content = content && 'value' in content ? content.value : null;
      this.wysiwygView = new App.View.WysiwygView({
        el: '.js-content',
        serializedContent: content ? JSON.parse(content) : {},
        readOnly: true
      });
      $('.-raw-html').fitVids();
    },

    index: function () {

    }

  });
})(this.App));
