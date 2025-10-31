// client/src/components/ui/Footer.tsx
import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <p>
        Made with <span className="heart">❤️</span> for GTD fans
      </p>
      <a
        href="https://ko-fi.com/redapemusic35"
        target="_blank"
        rel="noopener noreferrer"
        className="kofi-button"
      >
        <img
          height={36}
          src="https://storage.ko-fi.com/cdn/kofi2.png"
          alt="Buy Me a Coffee at ko-fi.com"
        />
      </a>
    </footer>
  );
};

export default Footer;
