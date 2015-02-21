//(function(w) {
	//var d = w.document;
	var loadingStuff = false;
	
	function checkOverflow() {
		var el = $('.scrollview-inner')[0];
		if (el.offsetHeight < el.scrollHeight) {
			$(document).unbind('touchmove');
		}
		else {
			$(document).bind('touchmove', function(e){e.preventDefault(); });
		}
	}

	var MBUtils = {
		folderList: [],
		songList: [],
		getLists: function(data) {
			this.folderList = [];
			this.songList = [];
			var contents = data.contents;
			var len = contents.length;
			for (var i=0;i<len;i++) {
				if (contents[i].is_dir == true) {
					var folderItem = contents[i].path;
					this.folderList.push(folderItem);
				} else {
					var songItem = contents[i].path;
					this.songList.push(songItem);
				}
			}
			if (this.folderList.length > 0) {
				this.renderFolder(this.folderList);
			}
			if (this.songList.length > 0) {
				if (window.location.hash == '#/' || '') return;
				this.renderSongs(this.songList);
			}
			checkOverflow();
		},
		render: function(path) {
			$('div[id=folders]').remove();
			$('div[id=songs]').remove();
			if (typeof path == 'string') {
				var link = path;
			} else {
				var link = path.id;
			}
			Dropbox.getFolder(link, function(data) {
				MBUtils.getLists(data);
			});
		},
		renderFolder: function(links) {
			$('#foldermain').append('<div id="folders"></div>');
			for (i=0; i<links.length; i++) {
				var link = document.createElement('a');
				var img = document.createElement('a');
				var b = unescape(links[i]);
				var c = b.split("/");
				var name = c[c.length-1];
				//link.id = links[i];
				var linkhref = '#/folder/' + links[i].split('/Music/tracks/')[1];
				var fhtml = [
					'<p>',
					'<a href="' + linkhref + '" class="folderimg"><span class="folderimg"></span></a>',
					'<a href="' + linkhref + '" class="folderlink">' + name + '</a>',
					'</p>'
				].join('\n');
				$("#folders").append(fhtml);
			}
		},
		renderSongs: function(mylinks) {
			var links = [];
			for (i=0; i<mylinks.length; i++) {
				if (mylinks[i].indexOf('.mp3' || '.m4a' || '.flac') !== -1) {
					links.push(mylinks[i]);
				}
			}
			$('#songmain').append("<div id=\'songs\'</div>");
			for (i=0; i<links.length; i++) {
				var link = document.createElement('a');
				var b = unescape(links[i]);
				var c = b.split("/");
				var name = c[c.length-1];
				var songpath = links[i];
				var songhref = '#/song' + songpath;
				var shtml = [
					'<p>',
					'<a href="' + songhref + '" class="songlink">' + name + '</a>',
					'</p>'
				].join('\n');
				$("#songs").append(shtml);
			}
		},
		getSongUrl: function(song) {
			var cache = Dropbox.getData("cache." + song);
			var expire = Dropbox.getData("expires." + song);
			var e = new Date(expire).getTime();
			var now = new Date().getTime();
			if (cache != 'null' && now <= e-600000) {
				var url = cache;
				console.log('using cache');
				MBPlayer.pickSong(song, url);
			} else {
				Dropbox.getMedia(song, function(data) {
					console.log('caching song');
					var url = data.url;
					var expire = data.expires;
					Dropbox.storeData("cache." + song, url);
					Dropbox.storeData("expires." + song, expire);
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
	};

	var MBPlayer = {
		next: 0,
		urls: [],
		audioPlayer: new Audio(),
		createPlayer: function() {
			this.audioPlayer.autoplay = false;
			this.audioPlayer.controls="controls";
			this.audioPlayer.addEventListener('ended', this.nextSong, false);
			this.audioPlayer.addEventListener('error', this.errorFallback, true);
			if ($('#player')) $('#player').append(this.audioPlayer);
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
			var z = c[c.length-1];
			$('#songtitle').html(z);
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
	};
	
	ruto
		.add('/', 'home', function() {
			MBUtils.render('Music/tracks/');
		})
		.add(/^\/folder\/(.+)$/i, 'folder', function() {
			var path = location.hash.split('#/folder/')[1];
			MBUtils.render('Music/tracks/' + path);
		})
		.add(/^\/song\/(.+)$/i, 'folder', function() {
			var path = location.hash.split('#/song')[1];
			MBUtils.getSongUrl(path);
		})

	window.onload = Dropbox.setup(function() {
		if (Dropbox.accessToken) {
			MBPlayer.createPlayer();
		}
		ruto.init();
	});
//})(window);