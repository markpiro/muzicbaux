
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
			if (data[i].is_dir == true) {
				var folderItem = data[i].path;
				this.folderList.push(folderItem);
			} else {
				var songItem = data[i].path;
				this.songList.push(songItem);
			}
		}
		if (this.folderList.length > 0) {
			this.getFolderLinks(this.folderList);
		}
		if (this.songList.length > 0) {
			this.getSongLinks(this.songList);
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
		$('#foldermain').append("<div id=\'folders\'</div>");
		for (i=0; i<links.length; i++) {
			var link = document.createElement('a');
			var b = unescape(links[i]);
			var c = b.split("/");
			var d = c[c.length-1];
			link.href = '#';
			link.innerHTML = d;
			link.onclick = function() {MBUtils.createFolderLinks(this); MBUtils.updateCurrentFolder(this);};
			link.id = links[i];
			link.className = 'folderlink';
			$("#folders").append(link);
			$(link).wrap('<p></p>');
		}
	},
	createSongLinks: function(x) {
		var link = x.id;
		$('div[id=songs]').remove();
		$('div[id=folders]').remove();
		Dropbox.getFolder(link, function(data) {
			MBUtils.getLists(data);
		});
		return false;
	},
	getSongLinks: function(links) {
		$('#songmain').append("<div id=\'songs\'</div>");
		for (i=0; i<links.length; i++) {
			var link = document.createElement('a');
			var b = unescape(links[i]);
			var c = b.split("/");
			var d = c[c.length-1];
			link.href = '#';
			link.innerHTML = d;
			//link.onclick = function() {MBUtils.createSongLinks(this);};
			link.onclick = function() {MBPlayer.pickSong(this); return false;};
			link.id = links[i];
			link.className = 'songlink';
			$("#songs").append(link);
			$(link).wrap('<p></p>');
		}
		this.urlList = [];
		for (i=0; i<this.songList.length; i++) {
			Dropbox.getMedia(i, MBUtils.songList[i], function(index, data) {
				for (var key in data){
					if (data.hasOwnProperty(key)){
						if (key == 'url'){
							MBUtils.urlList.push({key:index, value:data[key]});
						}
					}
				}
				if (MBUtils.urlList.length == MBUtils.songList.length) {
					MBPlayer.setUrls();
					MBPlayer.loadSong();
				}
			});
		}
	},
	clearStorage: function() {
		//localStorage.removeItem('muzicbauxcache.Music/tracks/');
		console.log('deleting storage');
		localStorage.clear();
	},
	updateCurrentFolder: function(x) {
		$("a.load").attr('id', x.id);
	},
	sortObject: function(o) {
		var result = {};
		var keys = [];
		var sorted = [];
		for (var i=0; i<o.length; i++) {
			result[o[i].key] = o[i].value;
		}
		for (key in o) {
			if (o.hasOwnProperty(key)) {
				keys.push(parseInt(key));
			}
		}
		keys.sort(function(a,b){return a-b});
		for (var i=0; i<keys.length; i++) {
			var k = keys[i];
			sorted.push(result[k]);
		}
		return sorted;
	}
}


var MBPlayer = {
	next: 0,
	urls: [],
	audioPlayer: new Audio(),
	createPlayer: function() {
		this.audioPlayer.autoplay = false;
		this.audioPlayer.controls="controls";
		this.audioPlayer.addEventListener('ended', this.nextSong, false);
		this.audioPlayer.addEventListener('error', this.errorFallback, true);
		document.getElementById("player").appendChild(this.audioPlayer);
	},
	setUrls: function() {
		this.next = 0;
		console.log('setting urls');
		this.urls = MBUtils.sortObject(MBUtils.urlList);
	},
	loadSong: function() {
		if (this.urls[this.next]) {
			this.audioPlayer.src=this.urls[this.next];
			this.audioPlayer.load();
			var b = unescape(this.urls[this.next]);
			var c = b.split("/");
			var d = c[c.length-1];
			$('#songtitle').html(d);
		}
	},
	previousSong: function() {
		if (this.next > 0) {
			if(this.audioPlayer) {
				this.next--;
				this.loadSong();
				this.audioPlayer.play();
			}
		} else {
			this.next = this.urls.length-1;
			this.loadSong();
			this.audioPlayer.play();
		}
	},
	nextSong: function() {
		if (MBPlayer.next < MBPlayer.urls.length) {
			if(MBPlayer.audioPlayer) {
				MBPlayer.next++;
				MBPlayer.loadSong();
				MBPlayer.audioPlayer.play();
			}
		}
		if (MBPlayer.next == MBPlayer.urls.length) {
			MBPlayer.next = 0;
			MBPlayer.loadSong();
			MBPlayer.audioPlayer.play();
		}
	},
	errorFallback: function() {
		//this.nextSong();
		console.log('unknown error');
	},
	playPause: function() {
		if(this.audioPlayer) {
			if (this.audioPlayer.paused) {
				this.audioPlayer.play();
			} else {
				this.audioPlayer.pause();
			}
		}
	},
	pickSong: function(num) {
		//console.log(num, this.urls);
		for (i=0;i<MBUtils.songList.length;i++) {
			if (MBUtils.songList[i] == num.id) {
				this.next = i;
			}
		}
		if (this.audioPlayer) {
			this.loadSong();
			this.audioPlayer.play();
		}
	}
}
