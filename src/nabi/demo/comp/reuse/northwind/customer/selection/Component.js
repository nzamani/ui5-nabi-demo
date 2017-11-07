sap.ui.define([
	"jquery.sap.global",
	"sap/m/Button",
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(jQuery, Button, UIComponent, JSONModel, Device, Filter, FilterOperator) {
	"use strict";

	var Component = UIComponent.extend("nabi.demo.comp.reuse.northwind.customer.selection.Component", {

		metadata : {
			manifest: "json",
			properties : {
				text: { type : "string", defaultValue : "Default Text"},
				renderButton: { type : "boolean", defaultValue : true}
			},
			aggregations : { },
			events : {
				customerSelected : {
					parameters : {
						customer : {type : "object"}
					}
				}
			}
		}

	});

	//=============================================================================
	//LIFECYCLE APIS
	//=============================================================================

	Component.prototype.init = function () {
		var oModel, oCompData;

		oCompData = this.getComponentData();
		if (typeof oCompData.renderButton === "boolean"){
			this.setRenderButton(oCompData.renderButton);
		}

		// call the init function of the parent - ATTENTION: this triggers createContent()
		UIComponent.prototype.init.apply(this, arguments);
		//now this here would work:
		//var oRoot = this.getRootControl();

		// we could create a device model and use it
		oModel = new JSONModel(Device);
		oModel.setDefaultBindingMode("OneWay");
		this.setModel(oModel, "device");
	};


	Component.prototype.createContent = function() {
		var oBtn, oTSD;

		oTSD = this._getCustomerSelectDialog();

		if (this.getRenderButton()) {
			oBtn = this._getOpenButton();
			oBtn.addDependent(oTSD);
			return oBtn;
		}
		// if we get here we might see the following logging if the dialog is opened:
		// "The Popup content is NOT connected with a UIArea and may not work properly!"
		return oTSD;
	};

	/**
	 * The component is destroyed by UI5 automatically.
	 * @public
	 * @override
	 */
	Component.prototype.destroy = function () {
		// call the base component's destroy function
		UIComponent.prototype.destroy.apply(this, arguments);

		if (this._oCustomerSelectDialogTemplate) {
			this._oCustomerSelectDialogTemplate.destroy();
		}
	};

	//=============================================================================
	//OVERRIDE SETTERS
	//=============================================================================

	/**
	 * Overrides method <code>setText</code> of the component to set this text in the button.
	 * @override
	 */
	Component.prototype.setText = function(sText) {
		if (this.getRenderButton()) {
			this._getOpenButton().setText(sText);
		}
		this.setProperty("text", sText);
		return this;
	};

	//=============================================================================
	//PUBLIC APIS
	//=============================================================================

	Component.prototype.open = function () {
		this.onShowCustomerSelectDialog();
	};

	//=============================================================================
	//EVENT HANDLERS
	//=============================================================================

	Component.prototype.onShowCustomerSelectDialog = function () {
		var oTSD, oBinding;

		oTSD = this._getCustomerSelectDialog();
		oBinding = oTSD.getBinding("items");
		if (!oBinding){
			oTSD.bindItems({
				path : "/Customers",
				template : this._getCustomerSelectDialogTemplate(),
				templateShareable : true,
				sorter : null,
				filters : null,
				parameters : null
			});
		}
		//oBinding.filter();		//reset not needed here because done automatically
		oTSD.open();
	};

	Component.prototype.onCustomerSearch = function (oEvent) {
		var oFilter, sQuery, oBinding, oTSD;

		sQuery = $.trim( oEvent.getParameter("value") );

		if (sQuery) {
			oFilter = new Filter({
				filters : [
					new Filter("CustomerID", FilterOperator.Contains, sQuery),
					new Filter("CompanyName", FilterOperator.Contains, sQuery)
				],
				and : false
			});
		}
		oTSD = this._getCustomerSelectDialog();
		oBinding = oTSD.getBinding("items");
		oBinding.filter(oFilter);
		/*
		oTSD.bindItems({
			path : "/Customers",
			template : this._getCustomerSelectDialogTemplate(),
			templateShareable : true,
			sorter : null,
			filters : oFilter,
			parameters : {
				custom : {
					search : sQuery		// this is for SAP GW OData V2 Guys while OData V4 supports $search :-)
				}
			}
		});
		*/

	};

	Component.prototype.onCustomerSelected = function(oEvent) {
		var aContexts, oCustomer;

		aContexts = oEvent.getParameter("selectedContexts");
		if (aContexts.length) {
			oCustomer = jQuery.extend({}, aContexts[0].getObject());	//clone
			this.fireCustomerSelected({
				customer : oCustomer
			});
		}
	};

	Component.prototype.onCustomerSelectDialogCancelled = function (oEvent) {
		//oEvent.getSource().unbindItems();		//we don't want this
	};

	//=============================================================================
	//PRIVATE APIS
	//=============================================================================

	Component.prototype._getOpenButton = function () {
		if (!this._oBtn) {
			this._oBtn = new Button(this.createId("openSelectDialogBtn"),{
				text : this.getText(),
				press : this.onShowCustomerSelectDialog.bind(this)
			});
		}
		return this._oBtn;
	};

	Component.prototype._getCustomerSelectDialog = function () {
		if (!this._oTSD) {
			this._oTSD = sap.ui.xmlfragment(this.getId(), "nabi.demo.comp.reuse.northwind.customer.selection.fragment.CustomerTableSelectDialog", this);
			this._oTSD.addStyleClass(this.getContentDensityClass());
		}
		return this._oTSD;
	};

	Component.prototype._getCustomerSelectDialogTemplate = function () {
		if (!this._oCustomerSelectDialogTemplate) {
			this._oCustomerSelectDialogTemplate = sap.ui.xmlfragment(this.getId(), "nabi.demo.comp.reuse.northwind.customer.selection.fragment.CustomerTableSelectDialogItem");
		}
		return this._oCustomerSelectDialogTemplate;
	};

	/**
	 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
	 * design mode class should be set, which influences the size appearance of some controls.
	 * @public
	 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
	 */
	Component.prototype.getContentDensityClass = function() {
		if (this._sContentDensityClass === undefined) {
			// check whether FLP has already set the content density class; do nothing in this case
			if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
				this._sContentDensityClass = "";
			} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
			this._sContentDensityClass = "sapUiSizeCompact";
			} else {
				// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
				this._sContentDensityClass = "sapUiSizeCozy";
			}
		}
		return this._sContentDensityClass;
	};

	return Component;

});
