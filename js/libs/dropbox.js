/*
 *  Dropbox Javascript library v1.0                                           *
 *  Copyright Peter Josling 2010  
 *  Refactored by Mark Piro 2012
 *	                                                                          *
 *  Requires jQuery 1.4.1 or newer (included in source)                       *
 *	                                                                          *
 *  Uses the Javascript OAuth library by John Kristian                        *
 *  http://oauth.googlecode.com/svn/code/javascript/                          *
 *	                                                                          *
 *  Also uses SHA1.js by Paul Johnston	                                      *
 *  http://pajhome.org.uk/crypt/md5/	                                      *
 *	                                                                          *
 *	                                                                          *
 *  Licensed under the Apache License, Version 2.0 (the "License");           *
 *  you may not use this file except in compliance with the License.          *
 *  You may obtain a copy of the License at                                   *
 *	                                                                          *
 *     http://www.apache.org/licenses/LICENSE-2.0                             *
 *	                                                                          *
 *  Unless required by applicable law or agreed to in writing, software       *
 *  distributed under the License is distributed on an "AS IS" BASIS,         *
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 *  See the License for the specific language governing permissions and       *
 *  limitations under the License.                                            */

var Dropbox = {};
	
//Change to your own Dropbox API keys
Dropbox.consumerKey = '5r3wdrpwl33ad74';
Dropbox.consumerSecret = 'sijai12vvzle8xy';

//Prefix for data storate - MUST be unique
Dropbox.prefix = "muzicbaux";

//Set to "Dropbox" if your application has been given full Dropbox folder access
Dropbox.accessType = "dropbox";

//Change the below line to true to use HTML5 local storage instead of cookies
Dropbox.authHTML5 = true;

//Set to false to disable file metadata caching
Dropbox.cache = true;

//Set this to your authorization callback URL
Dropbox.authCallback = "http://markpiro.github.com/muzicbaux/";

//Maximum number of files to list from a directory. Default 10k
Dropbox.fileLimit = 10000;

//Cookie expire time (in days). Default 10 years
Dropbox.cookieTime = 3650;

/*-------------------No editing required beneath this line-------------------*/

//If using HTML5 local storage
if (Dropbox.authHTML5 == true) {
	//Get tokens (only declares variables if the token exists)
	temp = localStorage.getItem(Dropbox.prefix + "requestToken")
	if (temp) {
		Dropbox.requestToken = temp;
	}
	
	temp = localStorage.getItem(Dropbox.prefix + "requestTokenSecret")
	if (temp) {
		Dropbox.requestTokenSecret = temp;
	}
	
	temp = localStorage.getItem(Dropbox.prefix + "accessToken")
	if (temp) {
		Dropbox.accessToken = temp;
	}
	
	temp = localStorage.getItem(Dropbox.prefix + "accessTokenSecret")
	if (temp) {
		Dropbox.accessTokenSecret = temp;
	}
} else {
	//Get cookies (for stored OAuth tokens)
	cookies = document.cookie;
	cookies = cookies.split(";");
	
	//Loop through cookies to extract tokens
	for (i in cookies) {
		c = cookies[i];
		while (c.charAt(0) == ' ') c = c.substring(1);
		c = c.split("=");
		switch (c[0]) {
			case Dropbox.prefix + "requestToken":
				Dropbox.requestToken = c[1];
			break;
			
			case Dropbox.prefix + "requestTokenSecret":
				Dropbox.requestTokenSecret = c[1];
			break;
			
			case Dropbox.prefix + "accessToken":
				Dropbox.accessToken = c[1];
			break;
			
			case Dropbox.prefix + "accessTokenSecret":
				Dropbox.accessTokenSecret = c[1];
			break;
		}
	}
	
	//While we're here, set the cookie expiry date (for later use)
	Dropbox.cookieExpire = new Date();
	Dropbox.cookieExpire.setDate(Dropbox.cookieExpire.getDate()+Dropbox.cookieTime);
	Dropbox.cookieExpire = Dropbox.cookieExpire.toUTCString();
}

//Setup function runs after libraries are loaded
Dropbox.setup = function(callback) {
	//Check if access already allowed
	console.log('setup');
	if (!Dropbox.accessToken || !Dropbox.accessTokenSecret) {
		console.log('accesstoken');
		//Check if already authorized, but not given access yet
		if (!Dropbox.requestToken || !Dropbox.requestTokenSecret) {
			console.log('requesttoken');
			//Request request token
			Dropbox.oauthReqeust({
				url: "https://api.dropbox.com/1/oauth/request_token",
				type: "jsonp",
				method: "GET",
				token: true,
				tokenSecret: true
			}, [], function(data) {
				data = data.split("&");
				dataArray = new Array();
				
				//Parse token
				for (i in data) {
					dataTemp =  data[i].split("=");
					dataArray[dataTemp[0]] = dataTemp[1];
				}
				
				//Store token
				Dropbox.storeData("requestToken",dataArray['oauth_token']);
				Dropbox.storeData("requestTokenSecret",dataArray['oauth_token_secret']);
				
				//Redirect to autorization page
				document.location = "https://www.dropbox.com/1/oauth/authorize?oauth_token=" + dataArray["oauth_token"] + "&oauth_callback=" + Dropbox.authCallback;
			});
		} else {
			console.log('oauth');
			//Request access token
			Dropbox.oauthReqeust({
				url: "https://api.dropbox.com/1/oauth/access_token",
				type: "jsonp",
				method: "GET",
				token: Dropbox.requestToken,
				tokenSecret: Dropbox.requestTokenSecret
			}, [], function(data) {
				data = data.split("&");
				dataArray = new Array();
				
				//Parse token
				for (i in data) {
					dataTemp =  data[i].split("=");
					dataArray[dataTemp[0]] = dataTemp[1];
				}
				
				//Store token
				Dropbox.storeData("accessToken",dataArray['oauth_token']);
				Dropbox.storeData("accessTokenSecret",dataArray['oauth_token_secret']);
				
				//Update variables with tokens
				Dropbox.accessToken = dataArray['oauth_token'];
				Dropbox.accessTokenSecret = dataArray['oauth_token_secret'];
				
				callback();
			});
		}
	}
	callback();
};

//Function to send oauth requests
Dropbox.oauthReqeust = function(param1,param2,callback) {
	//If the token wasn't defined in the function call, then use the access token
	//console.log('sending request');
	if (!param1.token) {
		param1.token = Dropbox.accessToken;
	}
	if (!param1.tokenSecret) {
		param1.tokenSecret = Dropbox.accessTokenSecret;
	}
	
	//If type isn't defined, it's JSON
	if (!param1.type) {
		param1.type = "jsonp";
	}
	
	//If method isn't defined, assume it's GET
	if (!param1.method) {
		param1.method = "GET";
	}
	
	//Define the accessor
	accessor = {
		consumerSecret: Dropbox.consumerSecret
	};
	
	//Outline the message
	message = {
		action: param1.url,
	    method: param1.method,
	    parameters: [
	      	["oauth_consumer_key", Dropbox.consumerKey],
	      	["oauth_signature_method","PLAINTEXT"]
	  	]
	};
	
	//Only add tokens to the request if they're wanted (vars not passed as true)
	if (param1.token != true) {
		message.parameters.push(["oauth_token",param1.token]);
	}
	if (param1.tokenSecret != true) {
		accessor.tokenSecret = param1.tokenSecret;
	}
	
	//If given, append request-specific parameters to the OAuth request
	for (i in param2) {
		message.parameters.push(param2[i]);
	}
	
	//Timestamp and sign the OAuth request
	OAuth.setTimestampAndNonce(message);
	OAuth.SignatureMethod.sign(message, accessor);
	
	//Post the OAuth request
	$.ajax({
		url: message.action,
		type: message.method,
		data: OAuth.getParameterMap(message.parameters),
		dataType: param1.type,
		
		success: function(data, textStatus, jqXHR) {
			//OAuth request successful - run callback
			callback(data, textStatus, jqXHR);
		},
		
		error: function(xhr, status, error) {
			//Something went wrong. Feel free to add a better error message if you want
			console.log(xhr.responseText);
		}
	});
}

//Function to store data (tokens/cache) using either cookies or HTML5, depending on choice
Dropbox.storeData = function(name,data) {
	//Escape data to be saved
	data = escape(data);
	
	//If using HTML5 local storage mode
	if (Dropbox.authHTML5 == true) {
		localStorage.setItem(Dropbox.prefix + name,data);
	} else {
		//Store data in cookie
		document.cookie = Dropbox.prefix + name + "=" + data + "; expires=" + Dropbox.cookieExpire + "; path=/";
	}
}

//Function to get data (tokens/cache) using either cookies or HTML5, depending on choice
Dropbox.getData = function(name) {
	//If using HTML5 local storage mode
	if (Dropbox.authHTML5 == true) {
		return unescape(localStorage.getItem(Dropbox.prefix + name));
	} else {
		//Get cookies
		cookies = document.cookie;
		cookies = cookies.split(";");
		
		//Loop through cookies to find the right one
		for (i in cookies) {
			c = cookies[i];
			while (c.charAt(0) == ' ') c = c.substring(1);
			c = c.split("=");
			if (c[0] == Dropbox.prefix + name) {
				return unescape(c[1]);
			};
		};
	};
}

/*    PUBLIC FUNCTIONS    */

//Function to get account info of user
Dropbox.getAccount = function(callback) {
	Dropbox.oauthReqeust({
		url: "https://api.dropbox.com/1/account/info"
	}, [], function(data) {
		callback(data);
	});
}

//Function to get file/folder metadata
Dropbox.getMetadata = function(path,callback) {
	Dropbox.oauthReqeust({
		url: "https://api.dropbox.com/1/metadata/" + Dropbox.accessType + "/" + path
	}, [["list","false"]], function(data) {
		for (var key in data){
			if (data.hasOwnProperty(key)){
				console.log(key + ": " + data[key]);
			}
		}
	});
}

Dropbox.getHash = function(path) {
	if (Dropbox.cache == true) {
		//Get cached data
		var c = Dropbox.getData("cache." + path);
		//console.log(jQuery.parseJSON(c));
		
		//If cached data exists
		if (c != "null") {
			//Parse the cached data and extract the hash
			var hash = jQuery.parseJSON(c).hash;
		} else {
			//Set to a blank hash
			hash = "00000000000000000000000000000000";
		}
	} else {
		//Set to a blank hash
		hash = "00000000000000000000000000000000";
	}
	return hash;
}

Dropbox.getFolder = function(path,callback) {
	console.log(path);
	//If caching is enabled, get the hash of the requested folder
	var hash = Dropbox.getHash(path);
	
	//Send the OAuth request
	Dropbox.oauthReqeust({
		url: "https://api.dropbox.com/1/metadata/" + Dropbox.accessType + "/" + path,
		type: "json"
	}, [
		["list","true"],
		//["status_in_response","true"],
		["hash",hash]
	], function(data, textStatus, jqXHR) {
		//If caching is enabled, check if the folder contents have changed
		if (Dropbox.cache == true) {
			if (jqXHR.status == 304) {
				//Contents haven't changed - return cached data instead
				console.log('folder contents unchanged');
				var data = Dropbox.getData("cache." + path);
				data = jQuery.parseJSON(data);
			} else {
				console.log('storing hash');
				//console.log(folderContents);
				localStorage.removeItem(Dropbox.prefix + "cache." + path);

				//Contents have changed - cache them for later
				Dropbox.storeData("cache." + path, JSON.stringify(data));
			};
		};
		callback(data);
	});
}

//Function to get the contents of a file
Dropbox.getFile = function(path,callback) {
	Dropbox.oauthReqeust({
		url: escape("https://api-content.dropbox.com/1/files/" + Dropbox.accessType + "/" + path),
		type: "jsonp"
	}, [], function(data) {
		callback(data);
	});
}

//Function to move a file/folder to a new location
Dropbox.moveFile = function(from,to,callback) {
	Dropbox.oauthReqeust({
		url: "https://api.dropbox.com/1/fileops/move"
	}, [
		["from_path",from],
		["to_path",to],
		["root",Dropbox.accessType]
	], function(data) {
		callback(data);
	});
}

//Function to copy a file/folder to a new location
Dropbox.copyItem = function(from,to,callback) {
	Dropbox.oauthReqeust({
		url: "https://api.dropbox.com/1/fileops/copy"
	}, [
		["from_path",from],
		["to_path",to],
		["root",Dropbox.accessType]
	], function(data) {
		callback(data);
	});
}

//Function to delete a file/folder
Dropbox.deleteItem = function(path,callback) {
	Dropbox.oauthReqeust({
		url: "https://api.dropbox.com/1/fileops/delete",
		type: "PLAINTEXT"
	}, [
		["path",path],
		["root",Dropbox.accessType]
	], function(data) {
		callback(data);
	});
}

//Function to create a folder
Dropbox.createFolder = function(path,callback) {
	Dropbox.oauthReqeust({
		url: "https://api.dropbox.com/1/fileops/create_folder"
	}, [
		["path",path],
		["root",Dropbox.accessType]
	], function(data) {
		callback(data);
	});
}

//Function to get a thumbnail for an image
Dropbox.getThumbnail = function(path,size) {
	//Check 'size' parameter is valid
	if (size != "small" && size != "medium" && size != "large") size = "small";
	
	//Send OAuth request
	Dropbox.oauthReqeust({
		url: escape("https://api-content.dropbox.com/1/thumbnails/" + Dropbox.accessType + "/" + path),
		type: "jsonp"
	}, [["size",size]], function(data) {
		callback(data);
	});
}

//Function to upload a file
Dropbox.uploadFile = function(path,file) {
	Dropbox.oauthReqeust({
		url: escape("https://api-content.dropbox.com/1/files/" + Dropbox.accessType + "/" + path),
		type: "jsonp",
		method: "POST"
	}, [["file",file]], function(data) {
		callback(data);
	});
}

Dropbox.getMedia = function(index, path, callback) {
	//urlList = [];
	Dropbox.oauthReqeust({
		url: "https://api.dropbox.com/1/media/" + Dropbox.accessType + "/" + path,
		type: "jsonp",
		method: "GET"
	}, [], function(data) {
		callback(index, data);
	});
}
