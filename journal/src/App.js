import React, { Component } from 'react';
import Markdown from "markdown-to-jsx";
import AceEditor from "react-ace";
import styled from 'styled-components';
import brace from "brace";
import 'brace/mode/markdown';
import 'brace/theme/dracula';
import './App.css';

const settings = window.require('electron-settings');
const fs = window.require('fs');
const { ipcRenderer } = window.require('electron');

class App extends Component {
  state = {
    loadedFile: '',
    directory: settings.get('directory') || null,
    filesData: []
  }

  constructor() {
    super();

    // On load
    const directory = settings.get('directory');
    if (directory) {
      this.loadAndReadFiles(directory);
    }

    ipcRenderer.on('new-file', (event, fileContent) => {
      this.setState({
        loadedFile: fileContent
      });
      
    });

    ipcRenderer.on('new-dir', (event, directory) => {
      this.setState({
        directory
      });

      settings.set('directory', directory)
      this.loadAndReadFiles(directory);
    });
  }

  loadAndReadFiles = (directory) => {
    fs.readdir(directory, (err, files) => {
      const filteredFiles = files.filter(file => file.includes('.md'));    
      const filesData = filteredFiles.map(file => ({
        path: `${directory}/${file}`
      }));
      
      this.setState({
        filesData
      })
    })
  }

  render() {
    return (
      <div className="App">
        <Header>Journal</Header>
        {this.state.directory ? (
          <Split>
            <div>
              { this.state.filesData.map(file => <h1>{ file.path }</h1>) }
            </div>
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
        ):(
          <LoadingMessage>
            <h1>Press Cmd or Ctrl + O to open directory.</h1>
          </LoadingMessage>
        )}
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

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  background-color: #191324;
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
