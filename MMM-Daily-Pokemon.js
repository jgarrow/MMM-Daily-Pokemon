/* global Module */

/* Magic Mirror
 * Module: mmm-daily-pokemon
 *
 * By
 * MIT Licensed.
 */

Module.register("mmm-daily-pokemon", {
	defaults: {
		updateInterval: 86400000, // 1 Day
		grayscale: true, // Turns pokemon image and type images gray to match magic mirror styles
		minPoke: 1, // Default to all pokemon
		maxPoke: 898, // Highest number - 802 pokemon currently exist
		showType: true, // Shows type icons below pokemon's image
		stats: true, // Displays pokemon stat table
		language: "en",
		genera: true, // Sub-description for the pokemon
		gbaMode: true, // Changes font to GBA style
		nameSize: 32, // Changes header size - px
		flavorText: false, // Displays flavor text for the pokemon
	},

	requiresVersion: "2.1.0", // Required version of MagicMirror

	start: function() { // Setting up interval for refresh
		const self = this;

		setInterval(function() {
			self.updateDom();
		}, this.config.updateInterval);
	},

	getDom: function() { // Creating initial div
		const wrapper = document.createElement("div");
		wrapper.id = "poke-wrapper";

		if (this.config.stats === true){
			wrapper.style.width = "400px";
		} else {
			wrapper.style.width = "250px";
		}

		const header = document.createElement("h4");
		header.innerHTML = "Daily Pokemon";
		header.id = "poke-header";

		//wrapper.appendChild(header);
		this.getData(wrapper); // Sending the request
		return wrapper;
	},

	getData: function(wrapper) { // Sends XHTTPRequest
		const self = this;
		const pokeNumber = Math.round(Math.random()*(this.config.maxPoke - this.config.minPoke) + this.config.minPoke);
		const apiURL = "https://pokeapi.co/api/v2/pokemon/" + pokeNumber + "/";
		const httpRequest = new XMLHttpRequest();

		const languageApiURL = "https://pokeapi.co/api/v2/pokemon-species/" + pokeNumber + "/";
		const languageHttpRequest = new XMLHttpRequest();
		let translatedName;
		const languageChosen = this.config.language;

		languageHttpRequest.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				const response = JSON.parse(this.responseText);
				Log.log(response);

				if (self.config.genera){
					response.genera.forEach(genera => {
						if(genera.language.name == languageChosen){
							const pokeSubName = document.getElementById("poke-subname");
							pokeSubName.innerHTML = genera.genus
						}
					});
				}

				// Get Translated Name and Flavor Text
				if (languageChosen){
					response.names.forEach(nameObject => {
						if(nameObject.language.name == languageChosen){
							translatedName = nameObject.name;
							const pokeName = document.getElementById("poke-name");
							pokeName.innerHTML = translatedName.charAt(0).toUpperCase() + translatedName.slice(1) + " - #" + pokeNumber
						}
					});

					const flavorTextDisplay = document.getElementById("flavor-text");

					if (flavorTextDisplay) {
						function checkLanguage(obj) {
							return obj.language.name == languageChosen
						}
						// get first flavor text matching selected language
						const flavorTextObj = response.flavor_text_entries.find(checkLanguage);
						// remove carriage returns, newlines, form-feeds for clean display
						const sanitizedText = flavorTextObj.flavor_text.replace(/\r\n/g, "")
						sanitizedText = sanitizedText.replace(/\f/g, " ")

						flavorTextDisplay.innerHTML = sanitizedText
					}
				}
			}
			 else {
				 return "Loading...";
			 }

		}

		httpRequest.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				console.log(JSON.parse(this.responseText));
				const responsePokemon = JSON.parse(this.responseText);
				Log.log(responsePokemon);
				languageHttpRequest.open("GET", languageApiURL, true);
				languageHttpRequest.send();

				self.createContent(responsePokemon, wrapper);
			} else {
				return "Loading...";
			}
		}

		httpRequest.open("GET", apiURL, true);
		httpRequest.send();
	},

	createContent: function(data, wrapper) { // Creates the elements for display
		const pokeWrapper = document.createElement("div");
		pokeWrapper.id = "poke-info";
		const flexWrapper = document.createElement("div");
		flexWrapper.id = "flex-wrapper";
		const pokeName = document.createElement("p");
		// TODO - maybe add an option to get rid of Pokedex #
		pokeName.innerHTML = data.name.charAt(0).toUpperCase() + data.name.slice(1) + " - #" + data.id;
		pokeName.id = "poke-name";

		if (this.config.gbaMode) {
			pokeName.style.fontFamily = "'pokegb'";
		}

		// Font size/style modification
		if (this.config.nameSize != 32) {
			pokeName.style.cssText = "font-size:" + this.config.nameSize + "px;" + this.config.gbaMode ? " font-family: 'pokegb';" : "";
		} else if (this.config.nameSize == 32 && this.config.gbaMode) { // Changing default size if gbaMode is enabled without size changes added
			pokeName.style.cssText = "font-size: 22px; font-family: 'pokegb';";
		}

		wrapper.appendChild(pokeName);

		if(this.config.genera){
			const pokeSubName = document.createElement("p");
			// TODO - maybe add an option to get rid of Pokedex #
			pokeSubName.id = "poke-subname";
			if (this.config.gbaMode) {
				pokeSubName.style.cssText = "font-family: 'pokegb'";
			}

			wrapper.appendChild(pokeSubName);
		}

		const pokePicWrapper = document.createElement("div");
		pokePicWrapper.id = "img-wrapper";
		const pokePic = document.createElement("img");
		pokePic.src = data.sprites.front_default;
		pokePic.id = "poke-pic";

		if (this.config.grayscale) {
			pokePic.id = "poke-pic-grayscale";
		}
		pokePicWrapper.appendChild(pokePic);
		pokeWrapper.appendChild(pokePicWrapper);

		const types = document.createElement("div");
		types.id = "poke-types";

		data.types.forEach(({type}, i) => {
			const typeImgWrapper = document.createElement("div");
			typeImgWrapper.className = "type-img-wrapper"
			const typeImg = document.createElement("img");
			typeImg.src = "./images/type-icons/" + type.name.toLowerCase() + "_icon_SwSh.png";

			if (this.config.grayscale) {
				typeImg.className = "poke-pic-grayscale-type";
			}

			typeImgWrapper.appendChild(typeImg);
			types.appendChild(typeImgWrapper);
		})

		// const type1 = document.createElement("span");
		// const type1Img = document.createElement("img");
		// type1Img.src = "https://serebii.net/pokedex-dp/type/" + data.types[0].type.name + ".gif"
		// if(this.config.grayscale){
		// 		type1Img.id = "poke-pic-grayscale-type"
		// 	}
		// type1.appendChild(type1Img);
		// //type1.innerHTML = data.types[0].type.name.charAt(0).toUpperCase() + data.types[0].type.name.slice(1);
		// types.appendChild(type1);
		// if(data.types[1]){
		// 	const type2 = document.createElement("span");
		// 	const type2Img = document.createElement("img");
		// 	if(this.config.grayscale){
		// 		type2Img.id = "poke-pic-grayscale-type"
		// 	}
		// 	type2Img.src = "https://serebii.net/pokedex-dp/type/" + data.types[1].type.name + ".gif"
		// 	//type2.innerHTML = data.types[1].type.name.charAt(0).toUpperCase() + data.types[1].type.name.slice(1)
		// 	type2.appendChild(type2Img);
		// 	types.appendChild(type2);
		// }

		pokeWrapper.appendChild(types);
		flexWrapper.appendChild(pokeWrapper);

		statWrapper = document.createElement("div");
		// TODO - Add in a stats table
		if (this.config.stats){
			const statTable = document.createElement("table");

			if (this.config.gbaMode) {
				statTable.style.cssText = "font-family: 'pokegb'";
			}

			for (let i = 5; i >= 0; i--) {//Inverted to list stats in right order
				const tr = document.createElement("tr");
				const tdName = document.createElement("td");
				const tdStat = document.createElement("td");

				tdName.innerHTML = this.translate(data.stats[i].stat.name);
				tdStat.innerHTML = data.stats[i].base_stat;

				tr.appendChild(tdName);
				tr.appendChild(tdStat);
				statTable.appendChild(tr);
			}

			statWrapper.appendChild(statTable);
			flexWrapper.appendChild(statWrapper);
		}

		wrapper.appendChild(flexWrapper);

		if (this.config.flavorText) {
			const flavorTextWrapper = document.createElement("div");
			flavorTextWrapper.id = "flavor-text-wrapper";

			const flavorText = document.createElement("p");
			flavorText.innerHTML = data.flavorTextDisplay ? data.flavorTextDisplay : "";
			flavorText.id = "flavor-text";

			flavorText.style.fontSize = "24px";
			flavorText.style.lineHeight = "1.5";

			if (this.config.gbaMode) {
				flavorText.style.fontFamily = "'pokegb'";
				flavorText.style.fontSize = "18px";
			}

			flavorTextWrapper.appendChild(flavorText);
			wrapper.appendChild(flavorTextWrapper);
		}
	},

	getStyles: function() {
		return [this.file('mmm-daily-pokemon.css')]
	},

	getTranslations: function() {
		return {
			en: "translations/en.json",
			fr: "translations/fr.json"
		}
	}
});
