var next = 0;
var folderList = [];
var songList = [];
var urlList = [];


var MBUtils = {};

MBUtils.getLists = function(data) {
	folderList = [];
	songList = [];
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
		};
	};
	//console.log(folderList);
	//console.log(songList);

	if (folderList.length > 0) {
		MBUtils.getFolderLinks(folderList);
	};

	if (songList.length > 0) {
		MBUtils.getSongLinks(songList);
	};
}

MBUtils.createFolderLinks = function(x) {
	$('div[id=folders]').remove();
	$('div[id=songs]').remove();
	if (typeof x == 'string') {
		var link = x;
	} else {
		var link = x.id;
	};
	Dropbox.getFolder(link, function(data) {
		MBUtils.getLists(data);
	});
	return false;
};
	
MBUtils.getFolderLinks = function(links) {
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
};
	
MBUtils.createSongLinks = function(x) {
	$('div[id=songs]').remove();
	$('div[id=folders]').remove();
	var link = x.id;
	Dropbox.getFolder(link, function(data) {
		MBUtils.getLists(data);
	});
	return false;
};
	
MBUtils.getSongLinks = function(links) {
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
	urlList = [];
	//console.log('SONGLIST: ' + songList);
	for (i=0; i<songList.length; i++) {
		Dropbox.getMedia(i, songList[i], function(index, data) {
			for (var key in data){
				if (data.hasOwnProperty(key)){
					//console.log(key + ": " + data[key]);
					if (key == 'url'){
						//console.log('storing url');
						urlList.push({key:index, value:data[key]});
					};
				};
			};
			if (urlList.length == songList.length) {
				//console.log('URLLIST: ' + urlList);
				//console.log('initplayer');
				MBPlayer.setUrls();
				MBPlayer.loadSong();
			};
			//issorted = false;
		});
	};
}
		
MBUtils.clearStorage = function() {
	//localStorage.removeItem('muzicbauxcache.Music/tracks/');
	console.log('deleting cache');
	localStorage.clear();
};
	
MBUtils.updateCurrentFolder = function(x) {
	$("a.load").attr('id', x.id);
};

MBUtils.sortObject = function(o) {
	//console.log('sorting');
	//issorted = true;
	var result = {};

	for (var i=0; i<o.length; i++) {
	    result[o[i].key] = o[i].value;
	};
	
	keys = Object.keys(result),
	i, len = keys.length;

	keys.sort();
	
	var sorted = [];

	for (i=0; i<len; i++) {
		k = keys[i];
		sorted.push(result[k]);
	};
	return sorted;
}


MBPlayer = {};

MBPlayer.createPlayer = function() {
	//console.log('URLS: ' + urls);
	//$('audio').remove();
	var audioPlayer = new Audio();
	audioPlayer.autoplay = false;
	audioPlayer.controls="controls";
	audioPlayer.addEventListener('ended', MBPlayer.nextSong, false);
	audioPlayer.addEventListener('error', MBPlayer.errorFallback, true);
	document.getElementById("player").appendChild(audioPlayer);
}

MBPlayer.setUrls = function() {
	next = 0;
	//if (issorted == false) {
	urlList = MBUtils.sortObject(urlList);
	//};
	//console.log('URLLIST: ' + urlList);
	urls = urlList;
	//console.log(urls.length);
}

MBPlayer.loadSong = function() {
	//console.log("URLS: " + urls);
	if (urls[next] != undefined) {
		var audioPlayer = document.getElementsByTagName('audio')[0];
		audioPlayer.src=urls[next];
		audioPlayer.load();
		var b = unescape(urls[next]);
		var c = b.split("/");
		var d = c[c.length-1];
		$('#songtitle').html(d);
		//console.log(d);
	};
}
	
MBPlayer.previousSong = function() {
	var audioPlayer = document.getElementsByTagName('audio')[0];
	if (next > 0) {
		if(audioPlayer!=undefined) {
			next--;
			MBPlayer.loadSong();
			audioPlayer.play();
		};
	} else {
		next = urls.length-1;
		//console.log('SONGLIST END');
		MBPlayer.loadSong();
		audioPlayer.play();
	};
}

MBPlayer.nextSong = function() {
	var audioPlayer = document.getElementsByTagName('audio')[0];
	if (next < urls.length) {
		if(audioPlayer != undefined) {
			next++;
			//console.log(next);
			MBPlayer.loadSong();
			audioPlayer.play();
		};
	};
	if (next == urls.length) {
		next = 0;
		//console.log(next);
		//console.log('SONGLIST START');
		MBPlayer.loadSong();
		audioPlayer.play();
	};
}

MBPlayer.errorFallback = function() {
	MBPlayer.nextSong();
}

MBPlayer.playPause = function() {
	//console.log("position: " + next);
	var audioPlayer = document.getElementsByTagName('audio')[0];
	if(audioPlayer!=undefined) {
		if (audioPlayer.paused) {
			audioPlayer.play();
		} else {
			audioPlayer.pause();
		};
	};
}

MBPlayer.pickSong = function(num) {
	for (i=0;i<songList.length;i++) {
		if (songList[i] == num.id) {
			next = i;
		};
	};
	//next = num;
	var audioPlayer = document.getElementsByTagName('audio')[0];
	if (audioPlayer != undefined) {
		//audioPlayer.src = urls[next];
		MBPlayer.loadSong();
		audioPlayer.play();
	};
}
