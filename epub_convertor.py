#!/usr/bin/env python3
"""
Text to EPUB Converter
Converts formatted text documents into EPUB format
"""

import re
import os
from ebooklib import epub
from datetime import datetime


class TextToEpubConverter:
    def __init__(self, title="Untitled", author="Unknown Author", language="en"):
        self.title = title
        self.author = author
        self.language = language
        self.chapters = []
        self.cover_image = None
        
    def set_cover_image(self, image_path):
        """Set cover image for the EPUB"""
        if os.path.exists(image_path):
            with open(image_path, 'rb') as f:
                self.cover_image = f.read()
            self.cover_image_name = os.path.basename(image_path)
            return True
        return False
        
    def parse_text(self, text):
        """Parse text and identify chapters based on markdown headers"""
        # Split by chapter markers (# at the beginning of a line)
        chapter_pattern = r'^#\s+(.+)$'
        
        # Find all chapter titles and their positions
        chapters = []
        for match in re.finditer(chapter_pattern, text, re.MULTILINE):
            chapters.append({
                'title': match.group(1).strip(),
                'start': match.start(),
                'end': match.end()
            })
        
        # Extract chapter content
        for i, chapter in enumerate(chapters):
            # Get content from current chapter to next chapter (or end of text)
            if i < len(chapters) - 1:
                content_start = chapter['end'] + 1
                content_end = chapters[i + 1]['start']
            else:
                content_start = chapter['end'] + 1
                content_end = len(text)
            
            content = text[content_start:content_end].strip()
            
            # Convert markdown formatting to HTML
            content = self.markdown_to_html(content)
            
            self.chapters.append({
                'title': chapter['title'],
                'content': content
            })
        
        # If no chapters found, treat entire text as one chapter
        if not self.chapters:
            content = self.markdown_to_html(text)
            self.chapters.append({
                'title': 'Chapter 1',
                'content': content
            })
    
    def markdown_to_html(self, text):
        """Convert basic markdown to HTML"""
        # Convert line breaks to paragraphs
        paragraphs = text.split('\n\n')
        html_paragraphs = []
        
        for para in paragraphs:
            if para.strip():
                # Handle special formatting
                para = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', para)  # Bold
                para = re.sub(r'\*(.+?)\*', r'<em>\1</em>', para)  # Italic
                para = re.sub(r'^##\s+(.+)$', r'<h2>\1</h2>', para, flags=re.MULTILINE)  # H2
                para = re.sub(r'^###\s+(.+)$', r'<h3>\1</h3>', para, flags=re.MULTILINE)  # H3
                para = re.sub(r'^---+$', '<hr/>', para, flags=re.MULTILINE)  # Horizontal rule
                
                # Wrap in paragraph tags if not already a heading
                if not para.strip().startswith('<h'):
                    para = f'<p>{para}</p>'
                
                html_paragraphs.append(para)
        
        return '\n'.join(html_paragraphs)
    
    def create_epub(self, output_filename):
        """Create EPUB file from parsed chapters"""
        book = epub.EpubBook()
        
        # Set metadata
        book.set_identifier(f'{self.title}_{datetime.now().strftime("%Y%m%d%H%M%S")}')
        book.set_title(self.title)
        book.set_language(self.language)
        book.add_author(self.author)
        
        # Add cover image if provided
        if self.cover_image:
            book.set_cover(self.cover_image_name, self.cover_image)
        
        # Create chapters
        epub_chapters = []
        spine = ['nav']
        
        for i, chapter in enumerate(self.chapters):
            # Create chapter
            ch = epub.EpubHtml(
                title=chapter['title'],
                file_name=f'chapter_{i+1}.xhtml',
                lang=self.language
            )
            ch.content = f'''
            <html>
            <head>
                <title>{chapter['title']}</title>
            </head>
            <body>
                <h1>{chapter['title']}</h1>
                {chapter['content']}
            </body>
            </html>
            '''
            
            book.add_item(ch)
            epub_chapters.append(ch)
            spine.append(ch)
        
        # Add navigation files
        book.toc = epub_chapters
        book.add_item(epub.EpubNcx())
        book.add_item(epub.EpubNav())
        
        # Create spine
        book.spine = spine
        
        # Add CSS for better formatting
        style = '''
        body {
            font-family: Georgia, serif;
            margin: 5%;
            text-align: justify;
        }
        h1 {
            text-align: center;
            margin-top: 20%;
            margin-bottom: 10%;
        }
        h2, h3 {
            margin-top: 1em;
            margin-bottom: 0.5em;
        }
        p {
            text-indent: 1.5em;
            margin: 0;
        }
        p:first-of-type {
            text-indent: 0;
        }
        em {
            font-style: italic;
        }
        strong {
            font-weight: bold;
        }
        hr {
            margin: 2em 0;
            border: none;
            text-align: center;
        }
        hr:after {
            content: "* * *";
        }
        '''
        
        nav_css = epub.EpubItem(
            uid="style_nav",
            file_name="style/nav.css",
            media_type="text/css",
            content=style
        )
        book.add_item(nav_css)
        
        # Write EPUB file
        epub.write_epub(output_filename, book, {})
        print(f"\n✅ EPUB file created: {output_filename}")


def main():
    print("=" * 60)
    print("📚 Text to EPUB Converter")
    print("=" * 60)
    
    # Request manuscript title
    print("\n📝 Enter manuscript title:")
    title = input("→ ").strip()
    if not title:
        title = "Untitled"
    
    # Request author name
    print("\n✍️  Enter author name:")
    author = input("→ ").strip()
    if not author:
        author = "Unknown Author"
    
    # Request text file name
    print("\n📄 Enter text file name (with .txt or .md extension):")
    input_file = input("→ ").strip()
    
    # Check if file exists
    if not os.path.exists(input_file):
        print(f"\n❌ Error: File '{input_file}' not found in current folder!")
        print("\n📁 Available text files in current folder:")
        text_files = [f for f in os.listdir('.') if f.endswith(('.txt', '.md'))]
        if text_files:
            for file in text_files:
                print(f"   - {file}")
        else:
            print("   No .txt or .md files found")
        return
    
    # Read file
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            text = f.read()
        print(f"\n✅ File '{input_file}' successfully read")
    except Exception as e:
        print(f"\n❌ Error reading file: {e}")
        return
    
    # Request cover image file name
    print("\n🖼️  Enter cover image file name (JPEG or PNG, press Enter to skip):")
    cover_file = input("→ ").strip()
    
    # Generate output filename
    base_name = os.path.splitext(os.path.basename(input_file))[0]
    output_filename = f"{base_name}.epub"
    
    # If file already exists, add number
    counter = 1
    while os.path.exists(output_filename):
        output_filename = f"{base_name}_{counter}.epub"
        counter += 1
    
    print(f"\n📖 Creating EPUB file...")
    print(f"   Title: {title}")
    print(f"   Author: {author}")
    print(f"   Output file: {output_filename}")
    
    # Create converter and process
    try:
        converter = TextToEpubConverter(
            title=title,
            author=author,
            language='en'
        )
        
        # Add cover image if provided
        if cover_file:
            if cover_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                if converter.set_cover_image(cover_file):
                    print(f"   Cover: {cover_file} ✅")
                else:
                    print(f"   Cover: {cover_file} not found, proceeding without cover")
                    print("\n📁 Available image files in current folder:")
                    image_files = [f for f in os.listdir('.') if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                    if image_files:
                        for file in image_files:
                            print(f"   - {file}")
            else:
                print("   ⚠️  Cover file must be JPEG or PNG format, proceeding without cover")
        
        converter.parse_text(text)
        
        print(f"\n📊 Found chapters: {len(converter.chapters)}")
        for i, chapter in enumerate(converter.chapters[:5]):  # Show first 5 chapters
            print(f"   {i+1}. {chapter['title']}")
        if len(converter.chapters) > 5:
            print(f"   ... and {len(converter.chapters) - 5} more chapter(s)")
        
        converter.create_epub(output_filename)
        
        print(f"\n🎉 Done! File saved in current folder.")
        print(f"   Path: {os.path.abspath(output_filename)}")
        
    except Exception as e:
        print(f"\n❌ Error creating EPUB: {e}")
        return


if __name__ == "__main__":
    main()