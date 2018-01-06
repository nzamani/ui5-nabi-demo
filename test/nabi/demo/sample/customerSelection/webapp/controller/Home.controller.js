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

			this._loadFirstComponentManually();
			this._loadSecondComponentManually();	//works also in older ui5 versions
		},

		_loadFirstComponentManually : function (){
			this.getOwnerComponent().createComponent({
				usage: "simpleCustomerSelectionWithoutButton",
				settings: {},
				componentData: {
					renderButton : false
				},
				async: true
			}).then(function(oComp){
				var oModel = this.getView().getModel("view");
				// needed to open the component's dialog
				this._oCustomerSelectionComp = oComp;

				oModel.setProperty("/customerSelectionLoaded", true);
				oComp.attachCustomerSelected(this.onCustomerSelected);
				//to avoid "The Popup content is NOT connected with a UIArea and may not work properly!"
				this.byId("myVBox").addItem(new ComponentContainer({
					//settings: { renderButton : false },
					component : oComp
				}));
			}.bind(this)).catch(function(oError) {
				jQuery.sap.log.error(oError);
			});
		},

		/**
		 * This is a workaround for older versions of UI5 where the <code>ComponentContainer</code>
		 * doesn't support the event <code>componentCreated</code> and the property <code>usage</code>. This approach allows to place the
		 * <code>ComponentContainer</code> somewhere in your view and set the component later after
		 * the component has been loaded. This also allows to access the loaded component directly right after
		 * it's available.
		 */
		_loadSecondComponentManually : function (){
			sap.ui.component({
				name: "nabi.demo.comp.reuse.northwind.customer.selection",
				settings: {},
				componentData: {},
				async: true
			}).then(function(oComp){
				oComp.setText("For old UI5 versions");
				oComp.attachCustomerSelected(this.onCustomerSelected);
				this.byId("compOldUi5Versions").setComponent(oComp);
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

		onExit : function() { }

	});
});
