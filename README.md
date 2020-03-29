# mw-trackandundo
Automatically track one user's contribution and undo them (**for vandalism only**)

This script is tested on Wikimedia sites and works fine, if you want to use it on other mediawiki based projects, it should work fine too.


## Usage
### On a specific wiki
Open your personal [common.js](https://en.wikipedia.org/wiki/Special:MyPage/common.js) page and add lines: (zh-hans, enwp for example)

`mw.loader.load('https://lwei02.github.io/mw-trackandundo/autoundo-zh-hans.js');`

### Globally on wikimedia sites:
Open your [global.js](https://meta.wikimedia.org/wiki/Special:MyPage/global.js) page and add lines: (en for example)

`mw.loader.load('https://lwei02.github.io/mw-trackandundo/autoundo-en.js');`
