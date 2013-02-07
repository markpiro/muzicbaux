
var MBUtils = {
	folderList: [],
	songList: [],
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
			link.onclick = function() {MBUtils.getSongUrl(this); return false;};
			link.id = i;
			link.path = links[i];
			link.className = 'songlink';
			$("#songs").append(link);
			$(link).wrap('<p></p>');
		}
	},
	/*getSongUrl: function(song) {
		Dropbox.getMedia(song.path, function(data) {
			MBPlayer.pickSong(song, data.url);
		});
	},*/
	getSongUrl: function(song) {
		var cache = Dropbox.getData("cache." + song.path);
		var expire = Dropbox.getData("expires." + song.path);
		var e = new Date(expire).getTime();
		var now = new Date().getTime();
		if (cache != 'null' && now <= e-600000) {
			var url = cache;
			console.log('using cache');
			MBPlayer.pickSong(song, url);
		} else {
			Dropbox.getMedia(song.path, function(data) {
				console.log('caching song');
				var url = data.url;
				var expire = data.expires;
				Dropbox.storeData("cache." + song.path, url);
				Dropbox.storeData("expires." + song.path, expire);
				MBPlayer.pickSong(song, url);
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
	loadSong: function(url) {
		this.audioPlayer.src = url;
		this.audioPlayer.load();
		var b = unescape(url);
		var c = b.split("/");
		var d = c[c.length-1];
		$('#songtitle').html(d);
	},
	previousSong: function() {
		var len = $('.songlink').length;
		if (this.next > 0) {
			this.next--;
		} else {
			this.next = len-1;
		}
		if (this.audioPlayer) {
			var song = $('#'+(this.next)+'.songlink')[0];
			MBUtils.getSongUrl(song);
		}
	},
	nextSong: function() {
		this.next++;
		var len = $('.songlink').length;
		if (this.next == len) {
			this.next = 0;
		}
		if (this.audioPlayer) {
			var song = $('#'+(this.next)+'.songlink')[0];
			MBUtils.getSongUrl(song);
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
	pickSong: function(song, url) {
		this.next = song.id;
		if (this.audioPlayer) {
			this.loadSong(url);
			this.audioPlayer.play();
		}
	}
}