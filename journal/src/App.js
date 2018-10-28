import React, { Component } from 'react';
import Markdown from "markdown-to-jsx";
import AceEditor from "react-ace";
import styled from 'styled-components';
import brace from "brace";
import 'brace/mode/markdown';
import 'brace/theme/dracula';
import './App.css';

const { ipcRenderer } = window.require('electron');

class App extends Component {
  state = {
    loadedFile: ''
  }

  constructor() {
    super();

    ipcRenderer.on('new-file', (event, fileContent) => {
      this.setState({
        loadedFile: fileContent
      });
      
    });
  }

  render() {
    return (
      <div className="App">
        <Header>Journal</Header>

        <Split>
          <CodeWindow>
            <AceEditor 
              mode="markdown"
              theme="dracula"
              onChange={newContent => {
                this.setState({
                  loadedFile: newContent
                })
              }}
              name="markdown_editor"
              value={this.state.loadedFile}
              />
          </CodeWindow>

          <RenderedWindow>
            <Markdown>
              { this.state.loadedFile }
            </Markdown>
          </RenderedWindow>
        </Split>
      </div>
    );
  }
}

export default App;

const Header = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10;
  background-color: #191324;
  color: #75717c;
  font-size: .8rem;
  height: 23px;
  line-height: 23px;
  text-align: center;
  box-shadow: 0px 3px 3px rgba(0, 0, 0, .2);
  -webkit-app-region: drag;
`;

const Split = styled.div`
  display: flex;
  height: 100vh;
`;

const CodeWindow = styled.div`
  flex: 1;
  padding-top: 2.5rem;
  height: 100%;
  background-color: #191324;
  overflow: hidden;
  .ace_editor {
    overflow: hidden;
    width: 100% !important;
    height: 100vh !important;
    margin: 0;
    padding: 0;
  }
`;

const RenderedWindow = styled.div`
  // flex: 1;
  background-color: #191324;
  width: 35%;
  height: 100%;
  padding: 20px;
  color: #fff;
  border-left: 1px solid #302b3a;
  h1, h2, h3, h4, h5, h6 {
    color: #82d8d8;
  }

  h1 {
    border-bottom: 3px solid #e54b4b;
    padding: 10px;
  }

  a {
    color: #e54b4b;
  }
`;
