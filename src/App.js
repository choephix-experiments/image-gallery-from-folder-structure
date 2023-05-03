import 'lightgallery/css/lightgallery.css';
import React, { useEffect, useState } from 'react';
import './App.css';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TreeItem from '@mui/lab/TreeItem';
import TreeView from '@mui/lab/TreeView';

import PhotoAlbum from 'react-photo-album';

import 'lightgallery/css/lightgallery.css';
import { LightgalleryProvider, LightgalleryItem } from 'react-lightgallery';

import Gallery from 'react-photo-gallery';

const urlParams = new URLSearchParams(window.location.search);

const URL_BASE = urlParams.get('host') ?? 'https://undroop.web.app';
function urlWithBase(path) {
  let base = URL_BASE;
  if (!base.startsWith('https://') && base.startsWith('http://')) base = 'https://' + base;
  if (!base.endsWith('/')) base = base + '/';
  return base + path;
}

const STRUCTURE_URL = urlWithBase('folder_structure.json');
console.log({ STRUCTURE_URL });

const SHOW_FILES = urlParams.get('files') === '' || !!JSON.parse(urlParams.get('files'));

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

      const folderClassName = folderContainsImage(item) ? 'with-images' : '';
      const hasSubfolders = item.children.some(c => c.children);

      return (
        <TreeItem
          key={itemId}
          nodeId={itemId}
          label={<span className={folderClassName}>{item.name}</span>}
        >
          {hasSubfolders && buildSidebar(item, itemId, item.path)}
        </TreeItem>
      );
    } else {
      return SHOW_FILES ? <TreeItem key={itemId} nodeId={itemId} label={item.name} /> : null;
    }
  });
};

const getCurrentPath = () => {
  const pathMatch = window.location.pathname.match(/^\/(.+)$/);
  return pathMatch ? pathMatch[1] : '';
};

const traverseTree = (node, path, callback) => {
  const newPath = [...path, node.name];

  callback(node, newPath);

  if ('children' in node) {
    node.children.forEach(child => {
      traverseTree(child, newPath, callback);
    });
  }
};

function App() {
  const [structure, setStructure] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(getCurrentPath());
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // window.history.pushState({}, '', currentFolder ? `/${currentFolder}?${location.search}` : '/');

  useEffect(() => {
    fetchStructure().then(structure => {
      traverseTree(structure, [], (node, path) => {
        node.path = path.join('/');
        if ('children' in node) {
          node.children.sort((a, b) => {
            if ('children' in a && !('children' in b)) return -1;
            if (!('children' in a) && 'children' in b) return 1;
            return a.name.localeCompare(b.name);
          });
        }
      });

      setStructure(structure);

      if (currentFolder) {
        const folderNode = findNodeByPath(structure, currentFolder);
        if (folderNode) {
          handleFolderClick(folderNode);
        }
      }
    });
  }, []);

  const handleFolderClick = folder => {
    const items = [];

    if ('children' in folder) {
      folder.children.forEach(child => {
        if (!('children' in child)) {
          if (!isSupportedImage(child.name)) {
            return;
          }

          const parentPath = folder.path.split('/');
          const path = [...parentPath, child.name];
          const url = urlWithBase(path.join('/'));
          items.push({
            src: url,
            thumb: url,
            width: child.width || 200,
            height: child.height || 200,
          });
        }
      });
    }

    setGalleryItems(items);
    setCurrentFolder(folder.path);
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

  const findNodeByPath = (node, targetPath) => {
    if (node.path === targetPath) {
      return node;
    }

    if ('children' in node) {
      for (const child of node.children) {
        const foundNode = findNodeByPath(child, targetPath);
        if (foundNode) {
          return foundNode;
        }
      }
    }

    return null;
  };

  const defaultTitle = urlWithBase(currentFolder);
  window.document.title = urlWithBase('');

  const handleImageClick = ({ photo }) => {
    setSelectedPhoto(photo);
    return navigator.clipboard.writeText(photo.src);
  };

  const backgroundCss = selectedPhoto != null ? `url(${selectedPhoto.src})` : `none`;
  // console.log(selectedPhoto?.src, backgroundCss);
  console.log(galleryItems);

  return (
    <div className='App'>
      <div className='Background' style={{ background: backgroundCss }} key={backgroundCss} />
      <div className='content'>
        <div className='panel sidebar'>
          {!structure ? null : (
            <TreeView
              defaultCollapseIcon={<ExpandMoreIcon />}
              defaultExpandIcon={<ChevronRightIcon />}
              onNodeSelect={(e, value) => {
                const node = getNodeById(structure, value);
                if (node) handleFolderClick(node);
              }}
              selected={findNodeByPath(structure, currentFolder)?.id}
            >
              {buildSidebar(structure, '0')}
            </TreeView>
          )}
        </div>
        <div className='divider' />
        <div className='panel gallery react_lightgallery'>
          {/**
           * VERSION 1
           **/}
          {/* <h1>{defaultTitle}</h1>
          <PhotoAlbum
            layout={galleryItems.length < 5 ? 'masonry' : 'rows'}
            targetRowHeight={240}
            onClick={handleImageClick}
            photos={galleryItems}
          /> */}
          {/**
           * VERSION 2
           **/}
          <LightgalleryProvider
            plugins={[window.lgZoom, window.lgThumbnail]}
            settings={{ mode: 'lg-fade', preload: 1 }}
          >
            {galleryItems.map((item, index) => (
              <LightgalleryItem key={currentFolder + '/' + index} src={item.src} thumb={item.thumb}>
                <img src={item.thumb} alt='' />
              </LightgalleryItem>
            ))}
          </LightgalleryProvider>
          {/**
           * VERSION 3
           **/}
          {/* <Gallery
            photos={galleryItems}
            // layout={galleryItems.length < 5 ? 'masonry' : 'rows'}
            // targetRowHeight={240}
            onClick={ev => {
              console.log(ev.target.src);
              setSelectedPhoto({ src: ev.target.src });
              return navigator.clipboard.writeText(ev.target.src);
            }}
          /> */}
        </div>
      </div>
    </div>
  );
}

export default App;
