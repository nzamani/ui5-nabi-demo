sap.ui.define([
	"nabi/sample/customerSelection/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/core/ComponentContainer"
], function(BaseController, JSONModel, MessageToast, ComponentContainer) {
	"use strict";

	return BaseController.extend("nabi.sample.customerSelection.controller.Home", {

		onInit : function(){
			var oModel;

			oModel = new JSONModel({
				customerSelectionLoaded : false
			});
			this.getView().setModel(oModel, "view");

			this.getOwnerComponent().createComponent({
				usage: "simpleCustomerSelectionWithoutButton",
				settings: {},
				componentData: {
					renderButton : false
				},
				async: true
			}).then(function(oComp){
				// needed for onExit() to destroy it in order to avoid memory leaks
				this._oCustomerSelectionComp = oComp;

				oModel.setProperty("/customerSelectionLoaded", true);
				oComp.attachCustomerSelected(this.onCustomerSelected);
				//to avoid "The Popup content is NOT connected with a UIArea and may not work properly!"
				this.byId("myVBox").addItem(new ComponentContainer({
					settings: {
						renderButton : false
					},
					component : oComp
				}));
			}.bind(this)).catch(function(oError) {
				jQuery.sap.log.error(oError);
			});

		},

		onComponentCreated : function(oEvent){
			var oComp = oEvent.getParameter("component");

			// use documented public Component APIs only
			oComp.setText("Select Customer");
			//...

			// ATTENTION: working with getRootControl() might break code in future, i.e. if the result is a different control.
			// Unless you know it will never change avoid the following code here:
			//var oBtn = oComp.getRootControl();		// will the result be a button any time in future?
			//oBtn.setText("Don't do this");

			oComp.attachCustomerSelected(this.onCustomerSelected);
		},

		onOpenCustomerSelection : function(){
			this._oCustomerSelectionComp.open();
		},

		onCustomerSelected : function(oEvent){
			var oCustomer = oEvent.getParameter("customer");
			MessageToast.show("Selected Customer: CustomerID=" + oCustomer.CustomerID + ", CompanyName=" + oCustomer.CompanyName);
			console.log(oCustomer);
		},

		onExit : function() {
			if (this._oCustomerSelectionComp) {
				this._oCustomerSelectionComp.destroy();
			}
		}

	});
});
