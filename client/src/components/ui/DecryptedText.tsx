import React, { useState, useEffect } from 'react';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  className?: string;
  characters?: string;
  encryptedClassName?: string;
}

export const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  speed = 40,
  maxIterations = 10,
  sequential = true,
  className = '',
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*',
  encryptedClassName = 'text-cyan-500 font-mono',
}) => {
  const [displayText, setDisplayText] = useState(text);

  const triggerDecrypt = () => {
    let iteration = 0;
    const length = text.length;

    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (sequential) {
              if (index < iteration) return text[index];
            } else {
              if (Math.random() < iteration / maxIterations) return text[index];
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join('')
      );

      iteration += 1 / (sequential ? 2 : 1);

      if (iteration >= (sequential ? length : maxIterations)) {
        setDisplayText(text);
        clearInterval(interval);
      }
    }, speed);
  };

  useEffect(() => {
    triggerDecrypt();
  }, [text]);

  return (
    <span
      className={`inline-block cursor-default ${className}`}
      onMouseEnter={() => {
        triggerDecrypt();
      }}
    >
      {displayText.split('').map((char, index) => {
        const isOriginal = char === text[index];
        return (
          <span
            key={index}
            className={isOriginal ? '' : encryptedClassName}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
};
