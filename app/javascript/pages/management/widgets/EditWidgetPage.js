import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import WidgetEditor, { Modal, Tooltip, Icons, setConfig, VegaChart, getVegaTheme, getConfig } from 'widget-editor';
import omit from 'lodash/omit';
import isEqual from 'lodash/isEqual';

import ExtendedHeader from 'components/ExtendedHeader';
import StepsBar from 'components/StepsBar';
import Notification from 'components/Notification';
import ThemeSelector from 'components/ThemeSelector';
import ToggleSwitcher from 'components/shared/ToggleSwitcher';

import { setStep, setWidgetCreationTitle, setWidgetCreationDescription, setWidgetCreationCaption } from 'redactions/management';

const STEPS = [
  {
    name: 'Name',
    description: 'Give your widget a name and a description.'
  },
  {
    name: 'Visualization',
    description: 'Please use the selector to change the type of visualization and choose the columns you want to use.'
  }
];

class EditWidgetPage extends React.Component {
  constructor(props) {
    super(props);

    // We set the config of the widget editor
    const { env } = props;
    setConfig({
      url: env.apiUrl,
      env: env.apiEnv,
      applications: env.apiApplications,
      authUrl: env.controlTowerUrl,
      assetsPath: '/packs/images/',
      userToken: env.user.token || undefined
    });

    // The next few lines are only for the advanced editor
    let theme = undefined;
    if (!props.widget.widget_config) {
      theme = { name: 'default' };
    } else if (!props.widget.widget_config.paramsConfig) {
      theme = props.widget.widget_config.config || { name: 'default' };
    }

    this.state = {
      // Whether we're currently editing the widget in the API
      editing: false,
      // Error while retrieving the widgetConfig from the widget-editor
      widgetConfigError: false,
      // Whether we're using the advanced editor
      advancedEditor: !props.widget.widget_config
        || !props.widget.widget_config.paramsConfig,
      // Whether the user has dismissed the warning when switching to
      // the advanced editor
      advancedEditorWarningAccepted: !props.widget.widget_config
        || !props.widget.widget_config.paramsConfig,
      // Whether we're loading the advanced editor
      advancedEditorLoading: false,
      // State of the advanced editor without the "config" object
      widgetConfig: omit(props.widget.widget_config || {}, 'config'),
      // Whether the preview of the avanced editor is loading
      previewLoading: false,
      // Error while saving the widget
      saveError: false,
      // Theme of the widget
      theme
    };

    this.onCustomizeTheme = this.onCustomizeTheme.bind(this);
  }

  componentWillMount() {
    this.props.setTitle(this.props.widget.name);
    this.props.setDescription(this.props.widget.description);

    if (this.state.advancedEditor && this.props.widget.metadata.length) {
      const metadata = this.props.widget.metadata[0].attributes;
      const caption = metadata.info && metadata.info.caption;
      if (caption) {
        this.props.setCaption(caption);
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if ((prevProps.currentStep !== 1 && this.props.currentStep === 1 && this.advancedEditor)
      || (!prevState.advancedEditor && this.state.advancedEditor)) {
      this.codeMirror = CodeMirror.fromTextArea(this.advancedEditor, {
        mode: 'javascript',
        autoCloseTags: true,
        lineWrapping: true,
        lineNumbers: true
      });

      this.codeMirror.on('change', () => {
        try {
          const widgetConfig = JSON.parse(this.codeMirror.getValue());
          this.setState({ widgetConfig });
        } catch (e) {
          // If there's an error in the JSON, we reset the widgetConfig
          // so the user sees the preview is empty
          this.setState({ widgetConfig: {} });
        }
      });
    }
  }

  /**
   * Event handler executed when the user toggles between
   * the "normal" and avanced editor
   */
  onToggleAdvancedEditor() {
    const toggleAdvancedEditor = () => {
      this.setState({
        advancedEditor: !this.state.advancedEditor,
        advancedEditorWarningAccepted: false
      });
    };

    if (this.state.advancedEditor) {
      return toggleAdvancedEditor();
    }

    return new Promise(resolve => this.setState({ advancedEditorLoading: true }, resolve))
      .then(() => this.getWidgetConfig())
      .then((res) => {
        const widgetConfig = Object.assign({}, res);
        delete widgetConfig.paramsConfig;
        delete widgetConfig.config;
        return new Promise(resolve => this.setState({
          widgetConfig,
          advancedEditorLoading: false
        }, resolve));
      })
      .catch(() => new Promise(resolve => this.setState({
        widgetConfig: {},
        advancedEditorLoading: false
      }, resolve)))
      .then(() => toggleAdvancedEditor());
  }

  /**
   * Event handler executed when the user clicks the "Update"
   * button
   */
  onClickUpdate() {
    this.setState({ editing: true });

    new Promise((resolve, reject) => { // eslint-disable-line no-new
      if (this.state.advancedEditor) {
        resolve(Object.assign({}, this.state.widgetConfig, { config: this.state.theme }));
      } else {
        this.getWidgetConfig()
          .then(resolve)
          .catch(reject);
      }
    }).then((widgetConfig) => {
      const widgetObj = Object.assign(
        {},
        {
          name: this.props.title || null,
          description: this.props.description
        },
        { widgetConfig }
      );

      let metadataObj = null;
      if (this.props.caption) {
        metadataObj = {
          info: {
            caption: this.props.caption
          }
        };
      }

      const widget = Object.assign({}, widgetObj, {
        application: [getConfig().applications],
        published: false,
        default: false,
        dataset: this.props.widget.dataset
      });

      const metadata = !metadataObj
        ? null
        : Object.assign({}, metadataObj, {
          id: this.props.widget.id,
          language: getConfig().locale,
          application: getConfig().applications
        });

      fetch(this.props.queryUrl, {
        method: 'PUT',
        body: JSON.stringify(Object.assign(
          {},
          { widget },
          { ...(!metadata ? {} : { metadata }) }
        )),
        credentials: 'include',
        headers: new Headers({
          'content-type': 'application/json'
        })
      }).then((res) => {
        if (res.ok) {
          window.location = this.props.redirectUrl;
        } else {
          throw new Error(res.statusText);
        }
      }).catch(() => {
        this.setState({ saveError: true, editing: false });
      });
    }).catch(() => {
      // We display a warning in the UI
      this.setState({ widgetConfigError: true, editing: false });
    });
  }

  /**
   * Event handler executed when the user changes the theme
   * of the widget
   * @param {object} themeConfiguration Theme configuration
   */
  onChangeTheme(themeConfiguration) {
    const defaultTheme = getVegaTheme();
    const theme = Object.assign({}, defaultTheme, {
      name: themeConfiguration.name,
      range: Object.assign({}, defaultTheme.range, {
        category20: themeConfiguration.category
      }),
      mark: Object.assign({}, defaultTheme.mark, {
        fill: themeConfiguration.mainColor
      }),
      symbol: Object.assign({}, defaultTheme.symbol, {
        fill: themeConfiguration.mainColor
      }),
      rect: Object.assign({}, defaultTheme.rect, {
        fill: themeConfiguration.mainColor
      }),
      line: Object.assign({}, defaultTheme.line, {
        stroke: themeConfiguration.mainColor
      })
    });

    // Only set the theme if it's actually different
    // This prevents VegaChart from crashing
    if (!isEqual(this.state.theme, theme)) {
      this.setState({ theme });
    }
  }

  /**
   * Event handler executed when the user modifies a
   * theme
   * @param {object} theme Customized theme
   */
  onCustomizeTheme(theme) {
    this.setState({ theme });
  }

  render() {
    // eslint-disable-next-line no-shadow
    const { currentStep, setStep, setTitle, setDescription, setCaption,
      title, description, caption, widget } = this.props;

    const { widgetConfigError, advancedEditor, advancedEditorWarningAccepted,
      advancedEditorLoading, widgetConfig, previewLoading,
      saveError, theme, editing } = this.state;

    const createdWithAdvancedMode = !this.props.widget.widget_config
      || !this.props.widget.widget_config.paramsConfig;

    let content;
    if (currentStep === 0) {
      content = (
        <div className="l-widget-creation -dataset">
          <div className="wrapper">
            <div className="c-inputs-container">
              <div className="container -big">
                <label htmlFor="name">Name</label>
                <input type="text" id="name" name="name" placeholder="My widget" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="container">
                <label htmlFor="description">Description</label>
                <textarea id="description" name="description" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      content = (
        <div>
          <Modal />
          <Tooltip />
          <Icons />
          <div className="l-widget-creation -visualization">
            <div className="wrapper">
              <div className="c-inputs-container">
                <div className="container">
                  <label>Widget theme</label>
                  <ThemeSelector
                    theme={this.state.theme && this.state.theme.name}
                    onChange={t => this.onChangeTheme(t)}
                  />
                </div>
              </div>
              <div className="widget-container">
                {advancedEditorLoading && <div className="c-loading-spinner -bg" />}
                {!createdWithAdvancedMode && (
                  <ToggleSwitcher
                    elements={['Widget editor', 'Advanced editor']}
                    selected={advancedEditor ? 'Advanced editor' : 'Widget editor'}
                    onChange={(newSelected) => {
                      const selected = advancedEditor ? 'Advanced editor' : 'Widget editor';
                      if (selected !== newSelected) {
                        this.onToggleAdvancedEditor();
                      }
                    }}
                  />
                )}
                {!advancedEditor && (
                  <WidgetEditor
                    datasetId={widget.dataset}
                    {...(widget ? { widgetId: widget.id } : {})}
                    widgetTitle={title}
                    widgetCaption={caption}
                    theme={this.state.theme}
                    onChangeTheme={this.onCustomizeTheme}
                    saveButtonMode="never"
                    embedButtonMode="never"
                    onChangeWidgetTitle={t => setTitle(t)}
                    onChangeWidgetCaption={c => setCaption(c)}
                    provideWidgetConfig={(func) => { this.getWidgetConfig = func; }}
                  />
                )}
                {advancedEditor && (
                  <div className="advanced-editor">
                    <div className="textarea-container">
                      <div className="caption-container">
                        <div className="c-inputs-container">
                          <div className="container">
                            <label htmlFor="widget-caption">Widget caption</label>
                            <input type="text" id="widget-caption" name="widget-caption" value={caption} onChange={({ target }) => setCaption(target.value)} />
                          </div>
                        </div>
                      </div>
                      <p>{`Make sure you're using a syntax compatible with Vega ${ENV.VEGA_VERSION.split('.')[0]}. Please remove the "$schema" attribute from the specification.`}</p>
                      <textarea
                        ref={(el) => { this.advancedEditor = el; }}
                        defaultValue={JSON.stringify(widgetConfig, null, 2)}
                      />
                    </div>
                    <div className="preview">
                      {previewLoading && <div className="c-loading-spinner -bg" />}
                      {widgetConfig && widgetConfig.data && (
                        <VegaChart
                          data={widgetConfig}
                          theme={this.state.theme}
                          showLegend
                          reloadOnResize
                          toggleLoading={loading => this.setState({ previewLoading: loading })}
                          getForceUpdate={(func) => { this.forceChartUpdate = func; }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <ExtendedHeader title={STEPS[currentStep].name} subTitle={STEPS[currentStep].description} />
        <StepsBar
          steps={STEPS.map(s => s.name)}
          currentStep={currentStep}
          onChangeStep={setStep}
        />

        {widgetConfigError && (
          <Notification
            type="warning"
            content="Unable to create the widget"
            additionalContent="Make sure the visualization is correctly previewed before submitting the widget."
            onClose={() => this.setState({ widgetConfigError: false })}
          />
        )}

        {saveError && (
          <Notification
            type="error"
            content="Unable to update the widget"
            additionalContent={advancedEditor ? 'Make sure you followed the requirements above the editor. If so, please try again later.' : 'Please try again later.'}
            onClose={() => this.setState({ saveError: false })}
          />
        )}

        {advancedEditor && !advancedEditorWarningAccepted && (
          <Notification
            type="warning"
            content="Once you've updated the widget with the advanced editor, you won't be able to use the simple interface anymore."
            dialogButtons
            closeable={false}
            onCancel={() => this.setState({ advancedEditor: false })}
            onContinue={() => this.setState({ advancedEditorWarningAccepted: true })}
            onClose={() => this.setState({ advancedEditor: false })}
          />
        )}

        {content}

        <div className="c-action-bar">
          <div className="wrapper">
            <button type="button" className="c-button -outline -dark-text" onClick={() => window.history.back()}>
              Cancel
            </button>
            <div>
              {currentStep >= 1 && (
                <button type="button" className="c-button -outline -dark-text" onClick={() => setStep(currentStep - 1)}>
                  Back
                </button>
              )}
              {currentStep === 0 && (
                <button type="submit" className="c-button" disabled={!title} onClick={() => setStep(currentStep + 1)}>
                  Continue
                </button>
              )}
              {currentStep === 1 && (
                <button type="submit" className="c-button" onClick={() => this.onClickUpdate()} disabled={editing}>
                  {editing && <div className="c-loading-spinner -inline -btn" />}
                  {!editing && 'Update'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

EditWidgetPage.propTypes = {
  /**
   * Widget to edit
   */
  widget: PropTypes.object,
  env: PropTypes.object.isRequired,
  currentStep: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  caption: PropTypes.string.isRequired,
  setStep: PropTypes.func.isRequired,
  setTitle: PropTypes.func.isRequired,
  setDescription: PropTypes.func.isRequired,
  setCaption: PropTypes.func.isRequired,
  queryUrl: PropTypes.string.isRequired,
  redirectUrl: PropTypes.string.isRequired
};

EditWidgetPage.defaultProps = {
  widget: null
};

function mapStateToProps(state) {
  return {
    env: state.env,
    currentStep: state.management.step,
    title: state.management.widgetCreation.title,
    description: state.management.widgetCreation.description,
    caption: state.management.widgetCreation.caption
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setStep: (...params) => dispatch(setStep(...params)),
    setTitle: (...params) => dispatch(setWidgetCreationTitle(...params)),
    setDescription: (...params) => dispatch(setWidgetCreationDescription(...params)),
    setCaption: (...params) => dispatch(setWidgetCreationCaption(...params))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(EditWidgetPage);
