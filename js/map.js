var map;
var gcSearch;
var markupLayer;

var initRenderColor = "#1A9171";
var opvIdentifier = {
    OV: 'Open Violation',
    RCV: 'Recently Closed Violation',
    HOA: 'Association'
};

require(["esri/map",
        "esri/dijit/HomeButton",
        "esri/dijit/Search",
        "esri/layers/ArcGISDynamicMapServiceLayer",
        "esri/layers/FeatureLayer",
        "esri/layers/GraphicsLayer",
        "esri/tasks/query",
        "esri/tasks/QueryTask",
        "esri/tasks/RelationshipQuery",
        "esri/tasks/locator",
        "esri/dijit/Scalebar",
        "esri/dijit/Geocoder",
        "esri/dijit/Legend",
        "esri/units",
        "esri/dijit/BasemapGallery",
        "esri/dijit/BasemapLayer",
        "esri/dijit/Basemap",
        "esri/layers/WebTiledLayer",
        "esri/toolbars/edit",
        "esri/toolbars/draw",
        "esri/InfoTemplate",
        "esri/graphic",
        "esri/graphicsUtils",
        "esri/geometry/Multipoint",
        "esri/geometry/Circle",
        "esri/renderers/SimpleRenderer",
        "esri/symbols/PictureMarkerSymbol",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/symbols/SimpleFillSymbol",
        "esri/Color",
        "esri/dijit/Popup",
        "dojo/dom",
        "dojo/dom-attr",
        "dojo/on",
        "dojo/query",
        "dojo/keys",
        "dojo/_base/event",
        "dojo/_base/connect",
        "application/bootstrapmap",
        "dojo/domReady!"
],
    function (Map, HomeButton, Search, ArcGISDynamicMapServiceLayer, FeatureLayer, GraphicsLayer, Query, QueryTask, RelationshipQuery, Locator,
        Scalebar, Geocoder, Legend, units, BasemapGallery, BasemapLayer,
        Basemap, WebTiledLayer, Edit, Draw, InfoTemplate, Graphic, graphicutils,
        Multipoint, Circle, SimpleRenderer, PictureMarkerSymbol, SimpleMarkerSymbol,
        SimpleLineSymbol, SimpleFillSymbol, Color, Popup, dom, domAttr, on,
        query, keys, event, connect, BootstrapMap) {
        "use strict";

        // Get a reference to the ArcGIS Map class
        map = BootstrapMap.create("tempeMap", {
            //basemap: "dark-gray-vector",
            center: [-111.93, 33.4],
            zoom: 14,
            logo: false,
            slider: true,
            scrollWheelZoom: true

        });

        var home = new HomeButton({
            map: map
        }, "HomeButton");
        home.startup();

        //define search
        gcSearch = new Search({
            enableLabel: false,
            enableInfoWindow: false,
            map: map


        }, "");
        gcSearch.sources[0].countryCode = "US";
        gcSearch.sources[0].singleLineFieldName = "SingleLine";
        gcSearch.sources[0].searchExtent = new esri.geometry.Extent({
            "xmin": -12816000,
            "ymin": 3666000,
            "xmax": -12096000,
            "ymax": 4444000,
            "spatialReference": {
                "wkid": 102100
            }
        });
        gcSearch.startup();

        query("#associations").on("keydown", function (event) {
            map.graphics.clear();
            markupLayer.clear();

            if (event.keyCode == keys.ENTER) {
                console.log(event.currentTarget.value);
                var sms = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 12,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                        new Color([66, 205, 163]), 0.8),
                    new Color([66, 205, 163, 0.35]));

                gcSearch.sources[0].highlightSymbol = sms;

                //If multiple results are found, it will default and select the first.
                gcSearch.search(event.target.value).then(function (response) {

                    //no dice try appending city and try one more time
                    if (!response) {

                        gcSearch.search(event.target.value + " , Tempe, AZ");
                    } else {
                        console.log(response);
                    }
                });


            } else {
                console.log("some other key press : " + event.keyCode);
            }
        });

        var symbol = new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SOLID,
                new Color([121, 136, 158, 1]),
                1
            ),
            new Color([121, 136, 158, 0])
        );


        map.on("load", function () {

            markupLayer = new GraphicsLayer();
            map.addLayer(markupLayer);


            var parcelLyr = new FeatureLayer("https://gis.tempe.gov/arcgis/rest/services/CommunityDevelopment/Parcels/MapServer/0", {
                minScale: 1128.497176,
                maxScale: 0
            });

            parcelLyr.setRenderer(new SimpleRenderer(symbol));

            addOverViewLayers(
                'https://gis.tempe.gov/arcgis/rest/services/CommunityDevelopment/Residential_Associations/MapServer/1',
                opvIdentifier.HOA);

            map.addLayer(parcelLyr);

            addOverViewLayers(
                'https://gis.tempe.gov/arcgis/rest/services/CommunityDevelopment/Code_Violations/MapServer/0',
                opvIdentifier.RCV);
            addOverViewLayers(
                'https://gis.tempe.gov/arcgis/rest/services/CommunityDevelopment/Code_Violations/MapServer/1',
                opvIdentifier.OV);

        });

        var darkMap = new WebTiledLayer("https://api.mapbox.com/styles/v1/sethlewistempe/ciuiu00k4002r2inog8qp4iwa/tiles/256/{level}/{col}/{row}@2x?access_token=pk.eyJ1Ijoic2V0aGxld2lzdGVtcGUiLCJhIjoiYWFmNzVlNjkyOGI4N2E4NzE0NTJkMjFjYzk5ZmRmOGUifQ.dkeg1KK9NfXvPjX3jYn4fg");

        map.addLayer(darkMap);

        function addOverViewLayers(in_type_url, in_type) {

            var overviewLayer = new esri.layers.FeatureLayer(in_type_url, {
                id: in_type,
                outFields: ["B1_APPL_STATUS", "B1_ALT_ID",
                    "B1_SPECIAL_TEXT", "GA_FNAME", "GA_LNAME", "B1_PARCEL_NBR",
                    "nbrhd_name", "Type"
                ],
                visible: true,
                mode: esri.layers.FeatureLayer.MODE_ONDEMAND
            });


            if (in_type === opvIdentifier.OV) {
                overviewLayer.on("click", function (evt) {
                    getInfoViolations(evt.graphic);
                });

            } else if (in_type === opvIdentifier.RCV) {
                overviewLayer.on("click", function (evt) {
                    getInfoClosed(evt.graphic);
                });

            } else {
                overviewLayer.on("click", function (evt) {
                    getInfoHOA(evt.graphic);
                });
            }

            overviewLayer.setOpacity(.9);
            map.addLayer(overviewLayer);
            map.infoWindow.resize(325, 160);

        }

        //jquery ready and then run the other jquery functions

        $(function () {
            var showInfoTimeout = setTimeout(function () {
                $('#helpInfoModal').modal('show');
            }, 1500);

            $('[data-toggle="tooltip"]').tooltip();

            intializeAutoComplete();
        });



    });



function getViolationContentFull(graphic) {
    return '<div class="text-center infoContent"> <h5 class="helpNoteText"><small>Status: <b>' +
        graphic.attributes.B1_APPL_STATUS + '</b><br/>' +
        'Violation Number: <b>' + graphic.attributes.B1_ALT_ID + '</b><br/>' +
        'Inspector: <b>' + graphic.attributes.GA_FNAME + ' ' + graphic.attributes
        .GA_LNAME + '</b><br/>' +
        'Description: <b>' + graphic.attributes.B1_SPECIAL_TEXT + '</b>' +
        ' </small></h5> </div>';
}

function getHOAContent(graphic) {
    return '<div class="text-center infoContent"> <h5 class="helpNoteText"><small>Name: <b>' +
        graphic.attributes.nbrhd_name + '</b><br/>' +
        'Type: <b>' + graphic.attributes.Type + '</b></div>';
}

function getInfoViolations(in_graphic) {
    map.infoWindow.hide();
    clearHtmlContent();

    getCoreData(in_graphic);
    getRelatedData(in_graphic.attributes["OBJECTID"], opvIdentifier.OV);
    getParcelData(in_graphic.attributes["B1_PARCEL_NBR"]);
}

function getInfoClosed(in_graphic) {
    map.infoWindow.hide();
    clearHtmlContent();

    getCoreData(in_graphic);
    getParcelData(in_graphic.attributes["B1_PARCEL_NBR"]);
}

function getInfoHOA(in_graphic) {
    map.infoWindow.hide();

    var hoaInfo = getHOAContent(in_graphic);
    $('.hoaContent').html(hoaInfo);
    $('#hoaInfoModal').modal('show');
}

function clearHtmlContent() {
    $('.frContent').html('');
    $('.frRelated').html('');
}

function getCoreData(in_graphic) {
    var tempStr = '';
    tempStr = getViolationContentFull(in_graphic);
    $('.frContent').html(tempStr);
    $('#ReportFullCon').modal('show');

}

//in_related_data[481].features[0].attributes.b1_alt_id

function getRelatedData(in_oid, in_ftype) {
    $('.frRelated').html('');

    var relatedQuery = new esri.tasks.RelationshipQuery();
    relatedQuery.outFields = ["iViolation", "iType"];
    relatedQuery.relationshipId = 0;
    relatedQuery.objectIds = [in_oid];
    map.getLayer(in_ftype).queryRelatedFeatures(relatedQuery, function (
        in_related_data) {

        for (relatedFeature in in_related_data) {

            renderRelatedRecord(in_related_data[relatedFeature]);
        }


    });

}

function renderRelatedRecord(relatedFeatures) {

    var teRR =
        ' <h4 data-toggle="tooltip" data-placement="left" id="frHeader"> Detailed Violations </h4>';

    for (feature in relatedFeatures.features) {
        teRR += '<div class="text-center infoContent infoRR">';
        teRR += ' <h5 class="helpNoteText"><small>VIOLATION: <b>' + relatedFeatures.features[feature].attributes["iViolation"] + '</b></small></h5>';
        //teRR += ' <h5 class="helpNoteText"><small>REMEDY: <b>' + relatedFeatures.features[feature].attributes["iRemedy"] + '</b></small></h5>';
        teRR += ' <h5 class="helpNoteText"><small>TYPE: <b>' + relatedFeatures.features[feature].attributes["iType"] + '</b></small></h5>';
        teRR += '</div>';
    }

    $('.frRelated').html(teRR);
}

function getParcelData(in_parcel_number) {

    var query = new esri.tasks.Query();
    var queryTask = new esri.tasks.QueryTask(
        "https://gis.tempe.gov/arcgis/rest/services/CommunityDevelopment/Parcels/MapServer/0"
    );
    query.returnGeometry = false;
    query.outFields = ["Situs_Address_SI_STREET_NUM", "Situs_Address_SI_STREET_DIR", "Situs_Address_SI_STREET_NAME", "Situs_Address_SI_STREET_TYPE"];
    query.where = "PG_APN = '" + in_parcel_number + "'";

    queryTask.execute(query, function (results) {

        // Collect the results
        var resultItems = [];
        var resultCount = results.features.length;

        for (var i = 0; i < resultCount; i++) {

            var featureAttributes = results.features[i].attributes;

            var tePI = '<div class="text-center infoContent"><h5 class="helpNoteText"><small>Address:<b> ';

            for (attr in featureAttributes) {
                tePI += featureAttributes[attr] + ' ';
            }
            tePI += '</b></small></h5></div>';
            $('.frContent').append(tePI);

        }

    });
}

function intializeAutoComplete() {

    //var array = [];
    var query = new esri.tasks.Query();
    var queryTask = new esri.tasks.QueryTask(
        "https://gis.tempe.gov/arcgis/rest/services/CommunityDevelopment/Residential_Associations/MapServer/1"
    );
    query.returnGeometry = false;
    query.outFields = ["nbrhd_name"];
    query.where = "nbrhd_name <> ''";
    query.orderByFields = ["nbrhd_name ASC"]; //i think this will sort
    query.returnDistinctValues = true; //and then reduce to distinct list

    queryTask.execute(query, function (results) {

        // Collect the results
        var resultItems = [];
        var resultCount = results.features.length;

        for (var i = 0; i < resultCount; i++) {

            var featureAttributes = results.features[i].attributes;
            for (var attr in featureAttributes) {
                // Convert the attribute to a string. Null Values create an extra comma which stops the widget from functioning.
                var tempAssociation = String(featureAttributes[attr]);
                // push the attributes tothe blank array
                resultItems.push(tempAssociation);

            }

        }

        $("#associations").autocomplete({
            source: function (request, response) {
                var results = $.ui.autocomplete.filter(
                    resultItems, request.term);

                response(results.slice(0, 20));
            },
            select: function (event, data) {
                showResults(data.item.value);
            }
        });

    });


}

//takes an input string, runs a query and add a feature to the map
function showResults(in_query_term) {
    markupLayer.clear();

    //get a reference back to the HOA layer
    var tempLyr = map.getLayer(opvIdentifier.HOA);
    var tempQuery = new esri.tasks.Query();
    tempQuery.where = "nbrhd_name = '" + in_query_term + "'";
    tempLyr.queryFeatures(tempQuery, function (results) {

        var outlineSymbol = new esri.symbol.SimpleLineSymbol();
        outlineSymbol.setStyle(esri.symbol.SimpleLineSymbol.STYLE_SOLID);
        outlineSymbol.setWidth(6);
        outlineSymbol.setColor(new esri.Color([66, 205, 163, 0.9]))

        var symbol = new esri.symbol.SimpleFillSymbol();
        symbol.setOutline(outlineSymbol);
        symbol.setColor(new esri.Color([66, 205, 163, 0.15]));

        var resultFeatures = results.features;

        for (var i = 0; i < resultFeatures.length; i++) {
            var resultGraphic = new esri.Graphic(resultFeatures[i].geometry,
                symbol, {
                    "Name": in_query_term
                });
            resultGraphic.setSymbol(symbol);
            markupLayer.add(resultGraphic);
            var tempExtent = resultGraphic.geometry.getExtent();
            map.setExtent(tempExtent.expand(5));

        }

    });

}
