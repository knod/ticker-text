# Ticker Text
A browser extension to give a little more accessiblity to online articles

(README DRAFT)

<!-- ========================= -->
## How to Use Ticker Text

### The Basics

There are two ways to read text on the page:

1. Click the extension's icon to automatically read the whole article on the page
2. Select any text by dragging over it with your mouse, then right click on your selected text and choose the "Read Selected Text" option.

`Pause` by clicking on the words in the reading bar. `Resume` by clicking on the words in the reading bar again. Open your reading speed settings by clicking on the gear icon on the left.

<!-- add wiki page about the various speed settings. add wiki period
Word length:

Contrary to expectations, reading small words can actually be more difficult than reading words of medium length. Long words also take a longer time to process.
-->

The progress bar is at the top, above the text, and shows you how far along you are in the text.


### More Controls

**Move back or forward by sentence** - you can move back one sentence at a time by clicking the back arrow on the left. You can also move backward and forward by sentence by using 'alt' + the right or left arrow key.

**Move backward or forward by word** - you can move backward or forward by word by pressing or holding down the right or left arrow key (don't use 'alt' for this).

**Move to a place in the text using the progress bar** - you can click on the progress bar to go to a spot in the text. For example, if you want to go to the middle of the text, click in the middle of the progress bar.


<!-- ========================= -->
## About

### RSVP

RSVP (rapid serial visual presentation) flashes one word at you at a time so that you're concentrating on that single word instead of the whole text. That's how Ticker Text works. It can be a bit awkard at first, but as you get used to it you can speed how quickly the words change. It has the potential to help people that have difficulty reading the text of articles, like those with dyslexia or visual impairments. It also has potential to ease reading on mobile devices. Some people swear by it for speed reading.

<!-- Replace with gif of our own when possible -->
It will look something like this: http://the-digital-reader.com/wp-content/uploads/2015/09/word-runner-gif.gif


### How It Finds Text (and doesn't)

When reading the whole page, this tool, with the help of other modules and libraries, parses the html and tries to identify the main text there. That feature is not guaranteed to work. It all depends on how the html of the website is built. If it's built in a zany way, or if the page's language isn't supported by Ticker Text, Ticker Text may not be able to detect the main text. If it can't find the text that way, it may fall back on showing all the text, which can sometimes be useful and sometimes annoying.

Selecting text should work anytime, though, so if you're having trouble try that.

Ticker Text also also tries to filter out a little of the noise often present in an article, like the numbers that reference footnotes. There isn't yet a setting to opt out of that.

Basically, it does its best. We're happy to take suggestions on how to make it better, though not all improvements are possible - computers aren't that good yet.

<!-- 

### Questions

**The words are off-center!** It's ok, the words are supposed to be off-center. When the eyes read a word, there is an optimal focal point placement around 30% into the word because of how your mind works. We haven't yet gotten around to accounting for rtl languages, but maybe it'll all work out ok. We're also hoping to allow you to choose to center the words instead if you would prefer to (sometime in the future).

 -->


<!-- ========================= -->
## Bugs and Suggestions

If you want to file a bug or make a suggestion, go to https://github.com/knod/ticker-text/issues and see if it's already there by using the search bar around the upper left part of the page. If it's not already there, click 'New Issue' around the upper right part of the page.


<!-- ========================= -->
<!-- ## Future

### Customization

The user will be able to customize things like:

- Maximum number of characters shown at a time (for some users with visual impairments), results in word fragments sometimes
- Amount of time a word will be displayed (based on the characteristics of the word)
- Font size
- Colors



### Playback

The user will have playback controls that can do things like:

- Currently
  - Play
  - Pause
  - Go back or forward one word at a time
  - Go back or forward one sentence at a time
  - Plain old rewind
  - Plain old fast forward
  - Drag a slider to get to a different parts of the text
- Planned
  - Go back or forward one paragraph at a time
  - Scroll horizontally through words
  - Scroll vertically through sentences



### Feedback to User

- Current
  - A progress bar showing the user how far they've gotten in the text
  - A quickly fading image and sound queue to show when they have pressed play or pause
- Planned
  - Audio feedback -->


<!-- ========================= -->
##Attributions

This tool was originally inspired by the [RSVP read plugin](https://github.com/jamestomasino/read_plugin) created by [jamestomasino](https://github.com/jamestomasino). 

It uses some independent node packages:

- [node-unfluff](https://github.com/ageitgey/node-unfluff) created by [ageitgey]. That modules parses the html and makes its best guess at what parts of the html represent what parts of an article. You can trace it all the way back to the Java article extractor called Goose.
- sbd to split sentences
- nouislider to create the slider inputs and scrubber bar

A lot of the original features were suggested by synapse25.

Thank you to everyone who has contributed to this project!


<!-- ========================= -->
## License

I have no idea what license this should have, but I gave it the ISC license that npm gives automatically (like MIT). Someone tell me something useful about licenses.

ISC License

Copyright (c) 2017, knod

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

