((function (App) {
  'use strict';

  App.Router.FrontMap = Backbone.Router.extend({

    routes: {
      '(/)': 'index'
    },

    index: function () {
      // Instantiate the common views here for the page, use the "routes" object to instantiate
      // per route views
    }

  });
})(this.App));