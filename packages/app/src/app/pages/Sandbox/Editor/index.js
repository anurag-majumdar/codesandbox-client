import * as React from 'react';
import SplitPane from 'react-split-pane';
import { inject, observer } from 'mobx-react';
import styled, { ThemeProvider } from 'styled-components';

import Fullscreen from 'common/components/flex/Fullscreen';
import getTemplateDefinition from 'common/templates';
import codesandbox from 'common/themes/codesandbox.json';

import { Container } from './elements';
import Workspace from './Workspace';
import Content from './Content';
import Header from './Header';
import Navigation from './Navigation';
import getVSCodeTheme from './utils/get-vscode-theme';

const STATUS_BAR_SIZE = 22;

const AOverride = styled.div`
  a {
    color: inherit;
  }
`;

class ContentSplit extends React.Component {
  state = {
    theme: {
      colors: {},
      vscodeTheme: codesandbox,
    },
    editorTheme: this.props.store.preferences.settings.editorTheme,
    customVSCodeTheme: this.props.store.preferences.settings.customVSCodeTheme,
  };

  componentDidMount() {
    this.loadTheme();
  }

  componentDidUpdate() {
    if (
      this.props.store.preferences.settings.editorTheme !==
        this.state.editorTheme ||
      this.props.store.preferences.settings.customVSCodeTheme !==
        this.state.customVSCodeTheme
    ) {
      this.loadTheme();
    }
  }

  loadTheme = async () => {
    const newThemeName = this.props.store.preferences.settings.editorTheme;
    const customVSCodeTheme = this.props.store.preferences.settings
      .customVSCodeTheme;

    try {
      const theme = await getVSCodeTheme(newThemeName, customVSCodeTheme);
      this.setState({ theme, editorTheme: newThemeName, customVSCodeTheme });
    } catch (e) {
      console.error(e);
    }
  };

  render() {
    const { signals, store, match } = this.props;
    const sandbox = store.editor.currentSandbox;

    // Force MobX to update this component by observing the following value
    this.props.store.preferences.settings.editorTheme; // eslint-disable-line
    this.props.store.preferences.settings.customVSCodeTheme; // eslint-disable-line

    const vscode = this.props.store.preferences.settings.experimentVSCode;

    const hideNavigation =
      store.preferences.settings.zenMode &&
      !store.workspace.openedWorkspaceItem;

    const templateDef = sandbox && getTemplateDefinition(sandbox.template);

    return (
      <ThemeProvider
        theme={{
          templateColor: templateDef && templateDef.color,
          templateBackgroundColor: templateDef && templateDef.backgroundColor,
          ...this.state.theme,
        }}
      >
        <Container className="monaco-workbench">
          <Header zenMode={store.preferences.settings.zenMode} />

          <Fullscreen style={{ width: 'initial' }}>
            {!hideNavigation && <Navigation />}

            <div
              style={{
                position: 'fixed',
                left: hideNavigation ? 0 : 'calc(3.5rem + 1px)',
                top: store.preferences.settings.zenMode ? 0 : '3rem',
                right: 0,
                bottom: vscode ? STATUS_BAR_SIZE : 0,
              }}
            >
              <SplitPane
                split="vertical"
                defaultSize={17 * 16}
                minSize={0}
                onDragStarted={() => signals.editor.resizingStarted()}
                onDragFinished={() => signals.editor.resizingStopped()}
                onChange={size => {
                  if (size > 0 && !store.workspace.openedWorkspaceItem) {
                    signals.workspace.setWorkspaceItem({ item: 'files' });
                  } else if (
                    size === 0 &&
                    store.workspace.openedWorkspaceItem
                  ) {
                    signals.workspace.setWorkspaceItem({ item: null });
                  }
                }}
                pane1Style={{
                  visibility: store.workspace.openedWorkspaceItem
                    ? 'visible'
                    : 'hidden',
                  maxWidth: store.workspace.openedWorkspaceItem ? 'inherit' : 0,
                }}
                pane2Style={{
                  height: '100%',
                }}
                style={{
                  overflow: 'visible', // For VSCode Context Menu
                }}
              >
                {store.workspace.openedWorkspaceItem ? <Workspace /> : <div />}
                <Content match={match} />
              </SplitPane>

              {vscode && (
                <AOverride
                  style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: STATUS_BAR_SIZE,
                  }}
                  className="monaco-workbench mac nopanel"
                >
                  <div
                    className="part statusbar"
                    id="workbench.parts.statusbar"
                  />
                </AOverride>
              )}
            </div>
          </Fullscreen>
        </Container>
      </ThemeProvider>
    );
  }
}

export default inject('signals', 'store')(observer(ContentSplit));
