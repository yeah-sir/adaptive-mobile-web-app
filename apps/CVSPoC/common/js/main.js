function wlCommonInit(){
	require([ "layers/core-web-layer", "layers/mobile-ui-layer" ], dojoInit);
	
}

function dojoInit() {
	require([ "dojo/ready","dojox/mobile/parser" ,"dojo/parser", "dojox/mobile", "dojo/dom", "dijit/registry", "dojox/mobile/ScrollableView", "dojox/mobile/View", "dojox/mobile/Heading", "dojox/mobile/TabBar", "dojox/mobile/TabBarButton", "dojox/mobile/IconItem", "dojox/mobile/IconContainer", "dojox/mobile/PageIndicator", "dojox/mobile/SwapView", "dojox/mobile/RoundRect", "dojox/mobile/Container", "dojox/mobile/Button", "dojox/mobile/ToolBarButton", "dojox/mobile/GridLayout", "gridx/mobile/Grid", "dijit/registry", "dojox/mobile/ProgressIndicator", "dojo/_base/connect",  "dojox/mobile/FixedSplitter",
		"dojox/mobile/Container",], function(ready) {
			ready(function() {
				$(".container").css("visibility","visible");
				(function($){
				//Application view
				var AppView = Backbone.View.extend({

					data: new Array(),

					getSpecialityData : function(){
						var invocationData = {
							adapter : 'SpecialityAdapter',
							procedure : 'getSpeciality',
							parameters : []
						};

						WL.Client.invokeProcedure(invocationData, {
							onSuccess : this.render,
							onFailure : this.getDataFailure
						});
					},

					getDataFailure : function(response){
						console.log("failed");
					},

					render: function(response){
						var that = this;
						console.log("Success getting data!!");
						//console.log(response.invocationResult.response.details.RxHistory.RxDetails);
						data = response.invocationResult.response.details.RxHistory.RxDetails;
						console.log("App view loaded");
						var cartDrugs = new CartDrugCollection();
						var prescDrugs = new PrescDrugCollection();
						for(var i=0;i<data.length;i++){
							if(data[i].fillStatus == "Ready Filled"){
								cartDrugs.add(data[i]);
							}else if(data[i].fillStatus == "Filled"){
								prescDrugs.add(data[i]);
							}
						}
							//redner the car view page
							var cartView = new CartView();
							cartView.render(cartDrugs, "page");

							//render the refill section in the History view
							var historyRefillView = new HistoryRefillView();
							historyRefillView.render(cartDrugs, prescDrugs ,"presc");

							//render the prescription history section in History view0
							//var historyPrescView = new HistoryPrescView();
							//historyPrescView.render(prescDrugs, ".prescHistory");
							
						}
					});


				//Ready to Refill model
				var CartDrug = Backbone.Model.extend({
					defaults:{
						"medicationName":"N/A",
						"dosage": "N/A",
						"daySupply":"N/A",
						"prescriberFirstName": "N/A",
						"prescriberLastName" : "N/A",
						"buttonPrefix" : "N/A"
					}
					
				});

				//Prescription History model
				var PrescDrug = Backbone.Model.extend({
					defaults:{
						"medicationName":"N/A",
						"dosage": "N/A",
						"daySupply":"N/A",
						"prescriberFirstName": "N/A",
						"prescriberLastName" : "N/A"
					}
					
				});
				
				//Refill Collection
				var CartDrugCollection = Backbone.Collection.extend({
					model: CartDrug
					
				});
				
				//History Collection
				var PrescDrugCollection = Backbone.Collection.extend({
					model: PrescDrug
					
				});
				
				//View of Cart drugs (refill)
				var CartView = Backbone.View.extend({

					render: function(cartDrugs,el){
						//console.log("Loading the Cart View");
						var that = this;
						var pageNumber = 1;
						var targetEl = el+pageNumber;
						_.each(cartDrugs.models,function(cartDrug){
							
							var buttonPrefix = cartDrug.get("medicationName");
							//console.log($("#"+buttonPrefix+"Button").length);
							if($("#"+buttonPrefix+"Button").length>0){
								//console.log("adding suffix");
								buttonPrefix = buttonPrefix + $("#"+buttonPrefix+"Button").length;
							}
							cartDrug.set("buttonPrefix", buttonPrefix);
							//console.log(cartDrug.get('buttonPrefix'));
							var buttonName = buttonPrefix+"Content";
							var addCartName = buttonPrefix+"Button";

							var template = _.template($("#drug_squares_cart").html(), {cartDrug: cartDrug});
							if(($("#"+targetEl).children(".squares").length+1) % 5 == 0){
								pageNumber++;
								var addView = new dojox.mobile.SwapView({
									id: el+pageNumber,
									selected: false,
									class: "cartPageContainer",
									stlye: "top:8px;"
								});
								var parentView = dijit.registry.byId("cartPageContainer");
								addView.placeAt(parentView,"last");
								addView.startup();
								$("#"+el+pageNumber).append("<div class='cartFillerDiv'></div>");
							}

							targetEl = el+pageNumber;
							$("#"+targetEl).append(template);

							$("#"+buttonName).on("click",function(){
								var detail_id = cartDrug.get("medicationName") + "Cartdetail";
								
								if(!dijit.registry.byId(detail_id)){
									console.log("Generating "+detail_id);
									$("#detailsPage h1").remove();
									var heading1 = new dojox.mobile.Heading({
										label: cartDrug.get("medicationName"),
										back: "Back",
										moveTo: "cart"
									});
									var detailView = dijit.registry.byId("detailsPage");
									heading1.placeAt(detailView.containerNode,"first");
									heading1.startup();
									var detailsTemplate = _.template($("#details_template").html(),{drug:cartDrug});
									$(".detailsContent").html(detailsTemplate);
								}

								var view0= dijit.registry.byId("cart");
								view0.performTransition("detailsPage", 1, "slide");
							});

							$("#"+addCartName).on("click",function(){

								var checkoutItem = new CheckoutView();
								checkoutItem.render(cartDrug);
								var view0= dijit.registry.byId("cartPageContainer");
								view0.performTransition("myCart", 1, "slide");
							});
							
						});
						dijit.registry.byId("cartPageInd").reset();
						return this;
						}
						});

				//View of History drugs (ready for refill)
				var HistoryRefillView = Backbone.View.extend({
					
					render: function(cartDrugs,prescDrugs,el){
						var that = this;
						console.log("Loading the Refill");
						$("#presc1").append("<p class='swapviewText'>Ready for Refill</p>");
						$("#presc1").append("<p class='swapviewSubText'>There are "+cartDrugs.length+" prescriptions ready to be refilled</p>");
						
						var pageNumber = 1;
						var targetEl = el+pageNumber;
						_.each(cartDrugs.models,function(cartDrug){
							var template = _.template($("#drug_history_ready").html(), {cartDrug: cartDrug});
							if(($("#"+targetEl).children(".squaresHistory").length+1) % 4 == 0){
								pageNumber++;
								var addView = new dojox.mobile.SwapView({
									id: el+pageNumber,
									selected: false,
								});
								var parentView = dijit.registry.byId("historyPageContainer");
								addView.placeAt(parentView,"last");
								addView.startup();
								$("#"+el+pageNumber).append("<div class='historyFillerDiv'></div>");
							}

							targetEl = el+pageNumber;
							console.log("adding to "+ targetEl);
							$("#"+targetEl).append(template);
							//console.log($("#"+targetEl).children(".squaresHistory").length);
							
							var buttonName = cartDrug.get("medicationName")+"DetailButton";
							
							$("#"+buttonName).on("click",function(){
								var detail_id = cartDrug.get("medicationName") + "Historydetail";
								
								if(!dijit.registry.byId(detail_id)){
									console.log("Generating "+detail_id);
									$("#detailsPage h1").remove();
									var heading1 = new dojox.mobile.Heading({
										label: cartDrug.get("medicationName"),
										back: "Back",
										moveTo: "history"
									});
									var detailView = dijit.registry.byId("detailsPage");
									heading1.placeAt(detailView.containerNode,"first");
									heading1.startup();

									var detailsTemplate = _.template($("#details_template").html(),{drug:cartDrug});
									$(".detailsContent").html(detailsTemplate);
								}
								var view0= dijit.registry.byId("history");
								view0.performTransition("detailsPage", 1, "slide");
							});
						});
var historyPrescView = new HistoryPrescView();
historyPrescView.render(prescDrugs,el,pageNumber);
return this;
}
});

				//View of History drugs (presc history)
				var HistoryPrescView = Backbone.View.extend({
					
					render: function(cartDrugs,el,pageNumber){
						var that = this;
						console.log("Loading the Presc");
						$("#"+el+pageNumber).append("<p class='swapviewText'>Recent Prescriptions</p>");
						
						var targetEl = el+pageNumber;
						_.each(cartDrugs.models,function(cartDrug){
							var template = _.template($("#drug_history_presc").html(), {cartDrug: cartDrug});
							if(($("#"+targetEl).children(".squaresHistory").length+1) % 4 == 0){
								pageNumber++;
								var addView = new dojox.mobile.SwapView({
									id: el+pageNumber,
									selected: false,
									stlye: "top:8px;"
								});
								var parentView = dijit.registry.byId("historyPageContainer");
								addView.placeAt(parentView,"last");
								addView.startup();
								$("#"+el+pageNumber).append("<div class='historyFillerDiv'></div>");
							}

							targetEl = el+pageNumber;
							//console.log("adding to "+ targetEl);
							$("#"+targetEl).append(template);

							var buttonName = cartDrug.get("medicationName")+"DetailButton";
							
							$("#"+buttonName).on("click",function(){
								var detail_id = cartDrug.get("medicationName") + "Historydetail";
								
								if(!dijit.registry.byId(detail_id)){
									console.log("Generating "+detail_id);
									$("#detailsPage h1").remove();
									var heading1 = new dojox.mobile.Heading({
										label: cartDrug.get("medicationName"),
										back: "Back",
										moveTo: "history"
									});
									var detailView = dijit.registry.byId("detailsPage");
									heading1.placeAt(detailView.containerNode,"first");
									heading1.startup();

									var detailsTemplate = _.template($("#details_template").html(),{drug:cartDrug});
									$(".detailsContent").html(detailsTemplate);
									
									var view0= dijit.registry.byId("history");
									view0.performTransition("detailsPage", 1, "slide");
								}
							});
						});
						dijit.registry.byId("historyPageInd").reset();
						return this;
						}
						});

var CheckoutView = Backbone.View.extend({

	render: function(drugName){
		var that = this;
		//console.log($("#"+drugName.get("medicationName")+"CartItem").length);
		if($("#"+drugName.get("medicationName")+"CartItem").length == 0){	
			var drugLabel = drugName.get("medicationName");
			var list = dijit.registry.byId("checkoutRect");
			var childWidget = new dojox.mobile.ListItem({label:drugLabel, rightIcon:"images/delete.png", id:drugLabel+"CartItem"});
			list.addChild(childWidget);
		}
		if($("#checkoutRect").children().length > 0){
			$(".cartText").text("Your items");	
		}
		$(".mblListItemRightIcon").on("click",function(){
							//console.log("Deleting");
							$(this).parent().remove();
							that.remove();
							if($("#checkoutRect").children().length > 0){
								$(".cartText").text("Your items");	
							}
							that.render();
						});
	}
});

$(document).ready(function(){

					//Loading the app
					var appView = new AppView();
					appView.getSpecialityData();
				});


})(jQuery);

});
});
}



