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

	var Component = UIComponent.extend("nabi.demo.comp.reuse.northwind.customer.selectionBtn.Component", {

		metadata : {
			manifest: "json",
			properties : {
				text: { type : "string", defaultValue : "Default Text"}
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
		var oModel;

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
		var oDialog, oButton;

		oDialog = this._getCustomerSelectDialog();

		oButton = this._getOpenButton();
		oButton.addDependent(oDialog);

		return oButton;
	};

	//=============================================================================
	//OVERRIDE SETTERS
	//=============================================================================

	/**
	 * Overrides method <code>setText</code> of the component to set this text in the button.
	 * @override
	 */
	Component.prototype.setText = function(sText) {
		this._getOpenButton().setText(sText);
		this.setProperty("text", sText);
		return this;
	};

	//=============================================================================
	//PUBLIC APIS
	//=============================================================================

	/**
	 * Opens the dialog for selecting a customer.
	 * @public
	 */
	Component.prototype.open = function () {
		this.onShowCustomerSelectDialog();
	};

	//=============================================================================
	//EVENT HANDLERS
	//=============================================================================

	Component.prototype.onShowCustomerSelectDialog = function () {
		var oTSD = this._getCustomerSelectDialog();
		//oTSD.getBinding("items").filter();	//reset not needed here (done in onCustomerSearch which is also triggered if dialog closes)
		oTSD.open();
	};

	Component.prototype.onCustomerSearch = function (oEvent) {
		var oTSD, oFilter, sQuery, oBinding;

		oTSD = this._getCustomerSelectDialog()
		oBinding = oTSD.getBinding("items");
		if (!oBinding){
			return;
		}

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
		oBinding.filter(oFilter);
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

	/**
	 * Returns the singleton Button which allows to open a dialog for selecting a customer. If the button
	 * does not exist it will be instantiated automatically.
	 * @private
	 * @return {sap.m.Button} the button (sigleton)
	 */
	Component.prototype._getOpenButton = function () {
		if (!this._oBtn) {
			this._oBtn = new Button(this.createId("openSelectDialogBtn"),{
				text : this.getText(),
				press : this.onShowCustomerSelectDialog.bind(this)
			});
		}
		return this._oBtn;
	};

	/**
	 * Returns the singleton TableSelectDialog which allows to select a customer. If the TableSelectDialog
	 * does not exist it will be instantiated automatically.
	 * @private
	 * @return {sap.m.TableSelectDialog} the dialog (sigleton)
	 */
	Component.prototype._getCustomerSelectDialog = function () {
		if (!this._oTSD) {
			this._oTSD = sap.ui.xmlfragment(this.getId(), "nabi.demo.comp.reuse.northwind.customer.selectionBtn.fragment.CustomerTableSelectDialog", this);
			this._oTSD.addStyleClass(this.getContentDensityClass());
		}
		return this._oTSD;
	};

	/**
	 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
	 * design mode class should be set, which influences the size appearance of some controls.
	 * @private
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
