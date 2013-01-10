//add description
var MBUtils = {
	folderList: [],
	songList: [],
	urlList: [],
	getLists: function(data) {
		//var folderList = MBUtils.folderList;
		//var songList = MBUtils.songList;
		var folderList = [];
		var songList = [];
		data = data.contents;
		var len = data.length;
		for (var i=0;i<len;i++) {
			//console.log(data[i].path);
			if (data[i].is_dir == true) {
				var folderItem = data[i].path;
				folderList.push(folderItem);
			} else {
				var songItem = data[i].path;
				songList.push(songItem);
			}
		}
		if (folderList.length > 0) {
			MBUtils.getFolderLinks(folderList);
		}
		if (songList.length > 0) {
			MBUtils.getSongLinks(songList);
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
		MBUtils.urlList = [];
		//console.log('SONGLIST: ' + songList);
		for (i=0; i<MBUtils.songList.length; i++) {
			Dropbox.getMedia(i, MBUtils.songList[i], function(index, data) {
				for (var key in data){
					if (data.hasOwnProperty(key)){
						//console.log(key + ": " + data[key]);
						if (key == 'url'){
							//console.log('storing url');
							MBUtils.urlList.push({key:index, value:data[key]});
						}
					}
				}
				if (MBUtils.urlList.length == MBUtils.songList.length) {
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
		MBPlayer.next = 0;
		MBPlayer.urls = MBUtils.sortObject(MBUtils.urlList);
	},
	loadSong: function() {
		var urls = MBPlayer.urls;
		//console.log("URLS: " + urls);
		if (urls[MBPlayer.next] != undefined) {
			var audioPlayer = document.getElementsByTagName('audio')[0];
			audioPlayer.src=urls[MBPlayer.next];
			audioPlayer.load();
			var b = unescape(urls[MBPlayer.next]);
			var c = b.split("/");
			var d = c[c.length-1];
			$('#songtitle').html(d);
			//console.log(d);
		}
	},
	previousSong: function() {
		var audioPlayer = document.getElementsByTagName('audio')[0];
		if (MBPlayer.next > 0) {
			if(audioPlayer!=undefined) {
				MBPlayer.next--;
				MBPlayer.loadSong();
				audioPlayer.play();
			}
		} else {
			MBPlayer.next = MBPlayer.urls.length-1;
			//console.log('SONGLIST END');
			MBPlayer.loadSong();
			audioPlayer.play();
		}
	},
	nextSong: function() {
		var audioPlayer = document.getElementsByTagName('audio')[0];
		if (MBPlayer.next < MBPlayer.urls.length) {
			if(audioPlayer != undefined) {
				MBPlayer.next++;
				//console.log(next);
				MBPlayer.loadSong();
				audioPlayer.play();
			}
		}
		if (MBPlayer.next == MBPlayer.urls.length) {
			MBPlayer.next = 0;
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
		for (i=0;i<MBPlayer.songList.length;i++) {
			if (MBPlayer.songList[i] == num.id) {
				MBPlayer.next = i;
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
