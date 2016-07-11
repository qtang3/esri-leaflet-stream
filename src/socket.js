var SocketFeatureLayer = L.esri.FeatureLayer.extend({
    
    subscribe: function(url) {
      var mine = this;

      L.esri.get(this.options.url, {}, function(error, response){
        if(error){
          console.log(error);
        } else {
          
          mine.options.socketUrl = response.streamUrls[0].urls[0] + '/subscribe';
          mine.options.idField = response.timeInfo.trackIdField;

          this._socket = new WebSocket(mine.options.socketUrl);

          this._socket.onopen = function () {
            mine.fire('socketConnected');
          };

          this._socket.onerror = function () {
            mine.fire('socketError');
          };
          
          this._socket.onmessage = function (e) {
            mine._onMessage(e);
          };

        }
      });
    },

    unsubscribe: function() {
      this._socket.close();
      this._socket = null;
    },

    _onMessage: function(e) {
      var geojson = L.esri.Util.arcgisToGeoJSON(JSON.parse(e.data));
      geojson.id = geojson.properties[this.options.idField];

      var layer = this._layers[geojson.id];

      if (layer) {
        this._updateLayer(layer, geojson);
        this.redraw(geojson.id);
      } else {
        this.createLayers([geojson]);
        layer = this._layers[geojson.id];
      }

      this.fire('socketMessage', {
        feature: geojson,
        layer: layer
      });
    }
  });

L.esri.socketFeatureLayer = function (options) {
  return new SocketFeatureLayer(options);
};

