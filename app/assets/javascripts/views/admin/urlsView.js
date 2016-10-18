((function (App) {
  'use strict';

  var Collection = Backbone.Collection.extend({
    // url: 'flag_colors.json'
  });

  App.View.UrlsView = Backbone.View.extend({
    className: 'c-urls',
    template: HandlebarsTemplates['admin/urls'],
    collection: new Collection(
      gon.urlArray
    ),
    defaults: {
      url: 'New url'
    },
    events: {
      'click .js-add-url': '_addUrl',
      'click .js-remove-url': '_removeUrl',
      'input input': '_updateUrl'
    },

    initialize: function (settings) {
      this.options = _.extend(this.defaults, settings);
      this.render();
    },

    _addUrl: function () {
      this.collection.push({ url: this.options.url });
      this.render();
    },

    /*

     */
    _removeUrl: function (e) {
      if (this._canRemoveUrl()) {
        var index = $(e.target).data('id'),
          model = this.collection.at(+index);
        this.collection.remove(model);
        this.render();
      }
    },

    _updateUrl: function (e) {
      var url = $(e.target).val(),
        position = $(e.target).data('id');

      this.collection.at(position).set({ url: url });
      this.render();
    },

    _canRemoveUrl: function () {
      return (this.collection.length > 0);
    },

    render: function () {
      console.log('Rendering urls');
      console.log(gon.urlControllerId);
      this.$el.html(this.template({
        urls: this.collection.toJSON(),
        inputId: gon.urlControllerId,
        inputName: gon.urlControllerName,
      }));
      this.setElement(this.el);
    }
  });
})(this.App));