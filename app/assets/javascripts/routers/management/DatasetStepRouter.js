((function (App) {
  'use strict';

  App.Router.ManagementDatasetStep = Backbone.Router.extend({

    routes: {
      '(/)': 'index'
    },

    initialize: function (params) {
      this.slug = params[0] || null;
    },

    index: function () {
      // Global variables
      this.datasetsContainer = document.querySelector('.js-datasets-container');
      this.datasets = Array.prototype.slice.call(document.querySelectorAll('.js-dataset'));

      this._initSearch();
      this._initNote();

      // Disable the register button and show a notification
      $('.js-register-dataset').on('click', function (e) {
        e.preventDefault();

        App.notifications.broadcast(Object.assign({},
          App.Helper.Notifications.page.datasetRegistration,
          {
            continueCallback: function () {
              window.location.href = e.target.href;
            }
          }
        ));
      });

      var submit = $('.js-submit')
      submit.one('click', function () {
        submit
         .addClass('c-loading-spinner -btn');
      });
    },

    /**
     *  Adds a search input and a submit button into the searchField container
     */
    _initSearch: function () {
      var searchField = document.createElement('input');
      searchField.setAttribute('type', 'input');
      searchField.setAttribute('placeholder', 'Search');

      var searchButton = document.createElement('button');
      searchButton.type = 'button';
      searchButton.textContent = 'Search';

      // We attach the event listeners
      searchField.addEventListener('input', _.throttle(function (e) {
        var results = this._getSearchResults(e.target.value);
        this._updateDatasetsList(results);
      }.bind(this), 300));
      searchButton.addEventListener('click', _.throttle(function () {
        var results = this._getSearchResults(searchField.value);
        this._updateDatasetsList(results);
      }.bind(this), 300));

      // We bind the elements to the DOM
      var searchFieldContainer = document.querySelector('.js-dataset-search');
      searchFieldContainer.innerHTML = ''; // We make sure the container is empty
      searchFieldContainer.appendChild(searchField);
      searchFieldContainer.appendChild(searchButton);

      // We parse the dataset collection for fuse
      this.fuseCollection = this.datasets.map(function (dataset) {
        return {
          id: dataset.dataset.id,
          name: dataset.dataset.name,
          contexts: dataset.dataset.contexts ? dataset.dataset.contexts.split(',') : []
        };
      });

      // We instantiate the Fuse Object
      this.fuse = new Fuse(this.fuseCollection, {
        include: ['matches'],
        keys: ['name', 'contexts'],
        tokenize: true,
        threshold: 0.1,
        matchAllTokens: true,
        shouldSort: false
      });
    },

    /**
     * If the page contains a note, link it to the note details
     */
    _initNote: function () {
      var note = document.querySelector('.js-note');
      var noteDetails = document.querySelector('.js-note-details');
      if (!note || !noteDetails) return;

      var link = note.querySelector('a');
      if (!link) return;

      link.addEventListener('click', function (e) {
        e.preventDefault();

        // We trigger the animation every time
        noteDetails.classList.remove('-highlighted');
        noteDetails.classList.add('-highlighted');

        var position = window.scrollY + noteDetails.getBoundingClientRect().top;
        window.scrollTo(0, position);
      });
    },

    /**
     * Search for a dataset and returns the list of matching dataset
     * @param {string} keyword - search
     * @returns {object[]} results
     */
    _getSearchResults: function (keyword) {
      if (!keyword || !keyword.length) return this.fuseCollection;
      return this.fuse.search(keyword).map(function (searchResult) {
        return searchResult.item;
      });
    },

    /**
     * Update the datasets list with the search results
     * @params {object[]} searchResults
     */
    _updateDatasetsList: function (searchResults) {
      this.datasets.forEach(function (dataset) {
        var id = dataset.dataset.id;
        var result = _.findWhere(searchResults, { id: id });
        dataset.style.display = result ? 'flex' : 'none';
      });
    }

  });
})(this.App));
