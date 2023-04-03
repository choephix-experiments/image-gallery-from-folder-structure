import React, { useState, useEffect } from 'react';
import './App.css';
import 'lightgallery/css/lightgallery.css';
import { LightgalleryProvider, LightgalleryItem } from 'react-lightgallery';

import TreeView from '@mui/lab/TreeView';
import TreeItem from '@mui/lab/TreeItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const urlParams = new URLSearchParams(queryString);

const URL_BASE = urlParams.get('host') ?? 'https://undroop.web.app/';
const STRUCTURE_URL = URL_BASE + (URL_BASE.endsWith('/') ? '' : '/') + 'folder_structure.json';

const SHOW_FILES = urlParams.get('files') == '' || !!JSON.parse(urlParams.get('files'));

const fetchStructure = async () => {
  const response = await fetch(STRUCTURE_URL);
  const data = await response.json();
  return data;
};

const supportedImageFormats = ['png', 'webp', 'jpg', 'jpeg', 'avif'];
const isSupportedImage = filename => {
  const extension = filename.split('.').pop().toLowerCase();
  return supportedImageFormats.includes(extension);
};

const folderContainsImage = folder => {
  if (!folder.children) return false;
  return folder.children.some(child => isSupportedImage(child.name));
};

const buildSidebar = (structure, nodeId, parentPath = '') => {
  if (!structure || !structure.children) return;

  return structure.children.map((item, index) => {
    const itemId = `${nodeId}-${index}`;

    if ('children' in item) {
      item.path = parentPath ? `${parentPath}/${item.name}` : item.name;

      const folderStyle = folderContainsImage(item) ? { color: 'blue', fontWeight: 'bold' } : {};

      return (
        <TreeItem key={itemId} nodeId={itemId} label={<span style={folderStyle}>{item.name}</span>}>
          {buildSidebar(item, itemId, item.path)}
        </TreeItem>
      );
    } else {
      return SHOW_FILES ? <TreeItem key={itemId} nodeId={itemId} label={item.name} /> : null;
    }
  });
};

function App() {
  const [structure, setStructure] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);

  useEffect(() => {
    fetchStructure().then(setStructure);
  }, []);

  const handleFolderClick = folder => {
    const items = [];

    if ('children' in folder) {
      folder.children.forEach(child => {
        if (!('children' in child)) {
          const parentPath = folder.path.split('/');
          const path = [...parentPath, child.name];
          items.push({
            src: URL_BASE + path.join('/'),
            thumb: URL_BASE + path.join('/'),
          });
        }
      });
    }

    setGalleryItems(items);
    setCurrentFolder(folder.name);
  };

  const getNodeById = (structure, nodeId) => {
    let result = null;

    const findNode = (node, currentId) => {
      if (currentId === nodeId) {
        result = node;
        return;
      }

      if ('children' in node) {
        node.children.forEach((child, index) => {
          findNode(child, `${currentId}-${index}`);
        });
      }
    };

    findNode(structure, '0');
    return result;
  };

  return (
    <div className='App'>
      <h1>{currentFolder || 'Select a folder from the sidebar'}</h1>
      <div className='content'>
        <div className='sidebar'>
          {structure && (
            <TreeView
              defaultCollapseIcon={<ExpandMoreIcon />}
              defaultExpandIcon={<ChevronRightIcon />}
              onNodeSelect={(e, value) => {
                const node = getNodeById(structure, value);
                if (node) {
                  handleFolderClick(node);
                }
              }}
            >
              {buildSidebar(structure, '0')}
            </TreeView>
          )}
        </div>
        <div className='gallery'>
          <LightgalleryProvider
            plugins={[window.lgZoom, window.lgThumbnail]}
            settings={{ mode: 'lg-fade', preload: 1 }}
          >
            {galleryItems.map((item, index) => (
              <LightgalleryItem key={index} src={item.src} thumb={item.thumb}>
                <img src={item.thumb} alt='' />
              </LightgalleryItem>
            ))}
          </LightgalleryProvider>
        </div>
      </div>
    </div>
  );
}

export default App;
