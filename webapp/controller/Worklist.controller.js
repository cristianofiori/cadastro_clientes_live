sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"cristianofiori/cadastroclientes/model/formatter"
], function (BaseController, JSONModel,  Filter, FilterOperator, MessageToast, formatter) {
	"use strict";

	return BaseController.extend("cristianofiori.cadastroclientes.controller.Worklist", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {

			var oViewModel = new JSONModel({
				moeda: "BRL",
				moedaEstrangeira: "JPY"
				});
				this.getView().setModel(oViewModel, "view");

			var oViewModel,
				iOriginalBusyDelay,
				oTable = this.byId("table");

			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			// keeps the search state
			this._aTableSearchState = [];

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
				shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
				shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
				shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
				tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay: 0
			});
			this.setModel(oViewModel, "worklistView");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function (oEvent) {
			// update the worklist's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress: function (oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},

		/**
		 * Event handler for navigating back.
		 * We navigate back in the browser history
		 * @public
		 */
		onNavBack: function () {
			// eslint-disable-next-line sap-no-history-manipulation
			history.go(-1);
		},


		onSearch: function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
			} else {
				var aTableSearchState = [];
				var sQuery = oEvent.getParameter("query");

				if (sQuery && sQuery.length > 0) {
					aTableSearchState = [new Filter("Nome", FilterOperator.Contains, sQuery)];
				}
				this._applySearch(aTableSearchState);
			}

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function () {
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject: function (oItem) {
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("ClienteID")
			});
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
		_applySearch: function (aTableSearchState) {
			var oTable = this.byId("table"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		},

		onSearchCustom: function (oEvent) {

			var aFilters = [];
			var sQuery = oEvent.getParameter("query");

			if (sQuery && sQuery.length > 0) {
				aFilters.push(new Filter("Nome", FilterOperator.Contains, sQuery));
			}

			var oTable = this.byId("table");
			oTable.getBinding("items").filter(aFilters, "Application"); //"Application" é um parametro opcional

		},

		onClienteDelete: function (oEvent) {


			var oTable = this.byId("table");
			var aItens = oTable.getSelectedContextPaths();
			//trecho comentado porém mantido, para comparação
			//var oItem = oEvent.getParameter("listItem"),
			//sPath = oItem.getBindingContext().getPath();

			

			for (var i = 0; i < aItens.length; i++) {
				//this.getView().getModel().remove(sPath,{
				this.getView().getModel().remove(aItens[i], {
					success: function () {
						MessageToast.show('Cliente eliminado com sucesso.');
					}.bind(this),
					error: function (e) {
						console.error(e);
					}.bind(this),
				});

			}

		},


		onCriarCliente: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("create", {});
		},

		onAlterarStatus: function (oEvent) {

			var oSource = oEvent.getSource();
			var bc = oSource.getParent().getBindingContext();
			var obj = bc.getObject();

			//verifica se extensão está implementada
			if(this.onAlterarStatusCheck){
				this.onAlterarStatusCheck(obj);
			}


			var oModel = this.getView().getModel();
			MessageToast.show("Alterando Status");
			oModel.callFunction(
				"/AlterarStatus", {
				method: "GET",
				urlParameters: {
					ID: obj.ClienteID
				},
				success: function (oData, response) {

				},
				error: function (oError) {

				}
			});

		},

		onClienteRead: function (oEvent) {

			var oModel2 = this.getView().getModel();			

			var aFilters = [];//array para preencher com filtros

					let v = this.getView();
					let oTable = v.byId('table');    

					let oBindingInfo = oTable.getBindingInfo('items');
					oTable.bindAggregation('items', {
						model: oBindingInfo.model,
						path: '/ClienteSet',
						
						template: oBindingInfo.template,
						templateShareable: true,
						sorter: [
							new sap.ui.model.Sorter("ClienteID", true),							
							],
						filters: aFilters,// informar aqui array de filtros preenchido
						
					});
		

		},
		handleUploadComplete: function() {
            sap.m.MessageToast.show("File Uploaded");
            var oFilerefresh = this.getView().byId("tableAnexo");
            oFilerefresh.getModel().refresh(true);
            sap.m.MessageToast.show("File refreshed");

        },

		handleUploadPress: function() {
			var oFileUploader = this.byId("fileUploader");

			oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
				name: "slug",
				value: oFileUploader.getValue()
			}));

			oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
				name: "x-csrf-token",
				value: this.getView().getModel().getSecurityToken()
			}));

			oFileUploader.setSendXHR(true);

			oFileUploader.upload();
/*
			oFileUploader.checkFileReadable().then(function() {
				oFileUploader.upload();
			}, function(error) {
				MessageToast.show("The file cannot be read. It may have changed.");
			}).then(function() {
				oFileUploader.clear();
			});
			*/
		},

		onPressAnexo:function(oEvent){
			var source = oEvent.getSource();
			var bc = source.getBindingContext();
			var obj = bc.getObject();
			var path = bc.getPath() ;

			var oModel = this.getView().getModel();
			oModel.getData();

			this.byId("image").bindElement({
				path: path  

			});

			

		},
		fun: function(oEvent) {
            var ctx = oEvent.getSource().getBindingContext();
            var nome  = ctx.getObject().Filename;
            
            var oModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZMONITORVENDAS_SRV/?sap-client=200");
            oModel.getData();

			var path = "/AnexoSet('" +  nome + "')/$value";
            oModel.read(path, {

                success: function(oData, response) {
                    var file = response.requestUri;
                    window.open(file);

                },
                error: function(erro) {

					if(erro);


                }
				
            });

        },



	});
});