//add description
var MBUtils = {
	folderList: [],
	songList: [],
	urlList: [],
	getLists: function(data) {
		this.folderList = [];
		this.songList = [];
		data = data.contents;
		var len = data.length;
		for (var i=0;i<len;i++) {
			//console.log(data[i].path);
			if (data[i].is_dir == true) {
				var folderItem = data[i].path;
				this.folderList.push(folderItem);
			} else {
				var songItem = data[i].path;
				this.songList.push(songItem);
			}
		}
		if (this.folderList.length > 0) {
			MBUtils.getFolderLinks(this.folderList);
		}
		if (this.songList.length > 0) {
			MBUtils.getSongLinks(this.songList);
		}
	},
	createFolderLinks: function(x) {
		$('div[id=folders]').remove();
		$('div[id=songs]').remove();
		if (typeof x == 'string') {
			var link = x;
		} else {
			var link = x.id;
		}
		Dropbox.getFolder(link, function(data) {
			MBUtils.getLists(data);
		});
		return false;
	},
	getFolderLinks: function(links) {
		//console.log(urllist);
		$('#foldermain').append("<div id=\'folders\'</div>");
		for (i=0; i<links.length; i++) {
			var link = document.createElement('a');
			link.href = '#';
			var b = unescape(links[i]);
			var c = b.split("/");
			var d = c[c.length-1];
			link.innerHTML = d;
			link.onclick = function() {MBUtils.createFolderLinks(this); MBUtils.updateCurrentFolder(this);};
			link.id = links[i];
			link.className = 'folderlink';
			//var div = document.getElementById('folders');
			//div.appendChild(link);
			$("#folders").append(link);
			$(link).wrap('<p></p>');
		}
	},
	createSongLinks: function(x) {
		$('div[id=songs]').remove();
		$('div[id=folders]').remove();
		var link = x.id;
		Dropbox.getFolder(link, function(data) {
			MBUtils.getLists(data);
		});
		return false;
	},
	getSongLinks: function(links) {
		//console.log(urllist);
		$('#songmain').append("<div id=\'songs\'</div>");
		for (i=0; i<links.length; i++) {
			var link = document.createElement('a');
			link.href = '#';
			var b = unescape(links[i]);
			var c = b.split("/");
			var d = c[c.length-1];
			link.innerHTML = d;
			//link.onclick = function() {MBUtils.createSongLinks(this);};
			link.onclick = function() {MBPlayer.pickSong(this); return false;};
			link.id = links[i];
			link.className = 'songlink';
			$("#songs").append(link);
			$(link).wrap('<p></p>');
		};
		this.urlList = [];
		//console.log('SONGLIST: ' + songList);
		for (i=0; i<this.songList.length; i++) {
			Dropbox.getMedia(i, this.songList[i], function(index, data) {
				for (var key in data){
					if (data.hasOwnProperty(key)){
						//console.log(key + ": " + data[key]);
						if (key == 'url'){
							//console.log('storing url');
							this.urlList.push({key:index, value:data[key]});
						}
					}
				}
				if (this.urlList.length == this.songList.length) {
					//console.log('URLLIST: ' + urlList);
					//console.log('initplayer');
					MBPlayer.setUrls();
					MBPlayer.loadSong();
				}
			});
		}
	},
	clearStorage: function() {
		//localStorage.removeItem('muzicbauxcache.Music/tracks/');
		console.log('deleting cache');
		localStorage.clear();
	},
	updateCurrentFolder: function(x) {
		$("a.load").attr('id', x.id);
	},
	sortObject: function(o) {
		var result = {};
		for (var i=0; i<o.length; i++) {
		    result[o[i].key] = o[i].value;
		}
		keys = Object.keys(result),
		i, len = keys.length;
		keys.sort();
		var sorted = [];
		for (i=0; i<len; i++) {
			k = keys[i];
			sorted.push(result[k]);
		}
		return sorted;
	}
}


var MBPlayer = {
	next: 0,
	urls: [],
	createPlayer: function() {
		//console.log('URLS: ' + urls);
		//$('audio').remove();
		var audioPlayer = new Audio();
		audioPlayer.autoplay = false;
		audioPlayer.controls="controls";
		audioPlayer.addEventListener('ended', MBPlayer.nextSong, false);
		audioPlayer.addEventListener('error', MBPlayer.errorFallback, true);
		document.getElementById("player").appendChild(audioPlayer);
	},
	setUrls: function() {
		this.next = 0;
		this.urls = MBUtils.sortObject(MBUtils.urlList);
	},
	loadSong: function() {
		//console.log("URLS: " + urls);
		if (this.urls[this.next] != undefined) {
			var audioPlayer = document.getElementsByTagName('audio')[0];
			audioPlayer.src=this.urls[this.next];
			audioPlayer.load();
			var b = unescape(this.urls[this.next]);
			var c = b.split("/");
			var d = c[c.length-1];
			$('#songtitle').html(d);
			//console.log(d);
		}
	},
	previousSong: function() {
		var audioPlayer = document.getElementsByTagName('audio')[0];
		if (this.next > 0) {
			if(audioPlayer!=undefined) {
				this.next--;
				MBPlayer.loadSong();
				audioPlayer.play();
			}
		} else {
			this.next = this.urls.length-1;
			//console.log('SONGLIST END');
			MBPlayer.loadSong();
			audioPlayer.play();
		}
	},
	nextSong: function() {
		var audioPlayer = document.getElementsByTagName('audio')[0];
		if (this.next < this.urls.length) {
			if(audioPlayer != undefined) {
				this.next++;
				//console.log(next);
				MBPlayer.loadSong();
				audioPlayer.play();
			}
		}
		if (this.next == this.urls.length) {
			this.next = 0;
			//console.log(next);
			//console.log('SONGLIST START');
			MBPlayer.loadSong();
			audioPlayer.play();
		}
	},
	errorFallback: function() {
		MBPlayer.nextSong();
	},
	playPause: function() {
		//console.log("position: " + next);
		var audioPlayer = document.getElementsByTagName('audio')[0];
		if(audioPlayer!=undefined) {
			if (audioPlayer.paused) {
				audioPlayer.play();
			} else {
				audioPlayer.pause();
			}
		}
	},
	pickSong: function(num) {
		for (i=0;i<songList.length;i++) {
			if (songList[i] == num.id) {
				this.next = i;
			}
		}
		//next = num;
		var audioPlayer = document.getElementsByTagName('audio')[0];
		if (audioPlayer != undefined) {
			//audioPlayer.src = urls[next];
			MBPlayer.loadSong();
			audioPlayer.play();
		}
	}
}
