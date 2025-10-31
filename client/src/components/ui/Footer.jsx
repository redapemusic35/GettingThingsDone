import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <p>
        Made with <span className="heart">❤️</span> for task flow fans
      </p>
      <a
        href="https://ko-fi.com/redapemusic35"
        target="_blank"
        rel="noopener noreferrer"
        className="kofi-button"
      >
        <img
          height="36"
          src="https://storage.ko-fi.com/cdn/kofi2.png"
          alt="Buy Me a Coffee at ko-fi.com"
        />
      </a>
    </footer>
  );
};

export default Footer;
