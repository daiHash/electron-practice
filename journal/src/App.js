import React, { Component } from 'react';
import Markdown from "markdown-to-jsx";
import AceEditor from "react-ace";
import styled from 'styled-components';
import dateFns from "date-fns";
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
    activeIndex: 0,
    directory: settings.get('directory') || null,
    filesData: [], 
    newEntry: false,
    newEntryName: ''
  }

  constructor() {
    super();

    // On load
    const directory = settings.get('directory');
    if (directory) {
      this.loadAndReadFiles(directory);
    }

    ipcRenderer.on('save-file', (event) => {
      this.saveFile();
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
      const filesData = filteredFiles.map(file => {
        const date = file.substr(
          file.indexOf('_') * 1,
          file.indexOf('.') - file.indexOf('_') - 1,
        )

        return {
          date,
          path: `${directory}/${file}`,
          title: file.substr(0, file.indexOf('_'))
        }
      });
      
      filesData.sort((a, b) => {
        const aDate = new Date(a.date);
        const bDate = new Date(b.date);
        const aSec = aDate.getTime();
        const bSec = bDate.getTime();
        return bSec - aSec;
      });

      this.setState({
        filesData
      }, () => {
        this.loadFile(0);
      });
    })
  }

  changeFile = index => () => {
    const { activeIndex } = this.state;
    if (index !== activeIndex) {
      this.saveFile();
      this.loadFile(index);
    }
  }

  loadFile = index => {
    const { filesData } = this.state;
    const content = fs.readFileSync(filesData[index].path).toString();

    this.setState({
      loadedFile: content,
      activeIndex: index
    });
  }

  saveFile = () => {
    const { activeIndex, loadedFile, filesData } = this.state;
    fs.writeFile(filesData[activeIndex].path, loadedFile, err => {
      if (err) {
        return console.error(err);
      } else {
        console.log('saved!');
      }
    });
  }

  newFile = (e) => {
    e.preventDefault();
    const { newEntryName, directory, filesData } = this.state;
    const fileDate = dateFns.format(new Date(), 'MM-DD-YYYY');
    const filePath = `${directory}/${newEntryName}_${fileDate}.md`;
    fs.writeFile(filePath, '', err => {
      if (err) return console.log(err);

      filesData.unshift({
        path: filePath,
        date: fileDate,
        title: newEntryName
      });

      this.setState({
        newEntry: false,
        newEntryName: '',
        loadedFile: '',
        filesData
      })
    })
  }

  render() {
    const { activeIndex, directory, filesData, loadedFile, newEntry, newEntryName } = this.state;

    return (
      <AppWrapper>
        <Header>Journal</Header>
        {directory ? (
          <Split>
            <FilesWindow>
              <Button onClick= {() => { this.setState({newEntry: !newEntry}) }}>
                + New File
              </Button>
              {
                newEntry &&
                  <form onSubmit={this.newFile}>
                    <input value={newEntryName} onChange={e => {
                      this.setState({newEntryName: e.target.value})
                    }} autoFocus type="text"/>
                  </form>
              }

              {filesData.map((file, index) => (
                <FileButton 
                  active={activeIndex === index}
                  onClick={this.changeFile(index)}>
                  <p className="title">
                    { file.title }
                  </p>
                  <p className="date">
                    { formatDate(file.date) }
                  </p>
                </FileButton>
              ))}
            </FilesWindow>
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
                value={loadedFile}
                />
            </CodeWindow>

            <RenderedWindow>
              <Markdown>
                { loadedFile }
              </Markdown>
            </RenderedWindow>
          </Split>
        ):(
          <LoadingMessage>
            <h1>Press Cmd or Ctrl + O to open directory.</h1>
          </LoadingMessage>
        )}
      </AppWrapper>
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

const AppWrapper = styled.div`
  margin-top: 23px;
`;

const Split = styled.div`
  display: flex;
  height: 100vh;
`;

const FilesWindow = styled.div`
  position: relative;
  background-color: #140f1d;
  border-right: 1px solid #302b3a;
  height: 100%;
  width: 20%;
  padding-top: 2.5rem;
  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    pointer-events: none;
    box-shadow: -10px 0 20px rgba(0, 0, 0, .3) inset;
  }
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

const FileButton = styled.button`
  padding: 10px;
  text-align: left;
  width: 100%;
  background-color: #191324;
  opacity: .4;
  color: #fff;
  border: none;
  border-bottom: 1px solid #302b3a;
  transition: all .3s ease;
  &:focus {
    outline: 0;
  }
  &:hover {
    opacity: 1;
    border-left: 4px solid #82d8d8;
    cursor: pointer;
  }
  ${({active}) => 
    active &&
    `
    opacity: 1;
    border-left: 4px solid #82d8d8;
    ` 
  }
  .title {
    font-weight: bold;
    font-size: .9rem;
    margin: 0 0 5px;
  }

  .date {
    margin: 0;
  }
`;

const Button = styled.div`
  display: block;
  background: transparent;
  color: #fff;
  border: 1px solid #82d8d8;
  border-radius: 4px;
  margin: 1rem auto;
  transition: .3s ease all;
  padding: 5px 10px;
  &:hover {
    background: #82d8d8;
    color: #191324;
  }
`;

const formatDate = date => {
  dateFns.format(new Date(date), 'MMMM Do YYYY');
}
