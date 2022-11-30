(function (global) {

    var Vol = function (sx, sy, depth, c) {

        if (Object.prototype.toString.call(sx) === '[object Array]') {

            //1D volume 
            this.sx = 1;
            this.sy = 1;
            this.depth = sx.length;

            this.w = global.zeros(this.depth);
            this.dw = global.zeros(this.depth);

            for (var i = 0; i < this.depth; i++) {

                this.w[i] = sx[i]

            }


        } else {

            this.sx = sx;
            this.sy = sy;
            this.depth = depth;
            var n = sx * sy * depth;
            this.w = global.zeros(n);
            this.dw = global.zeros(n);

            if (typeof c === 'undefined') {

                var scale = Math.sqrt(1.0 / (sx * sy * depth));
                for (var i = 0; i < n; i++) {
                    this.w[i] = global.randn(0.0, scale);
                }
            } else {

                for (var i = 0; i < n; i++) {

                    this.w[i] = c;
                }

            }

        }

    }


    Vol.prototype = {

       get: function(x,y,d) {
             var ix = ((this.sx * y) + x )*this.depth+d;
             return this.w[ix] 

       },
       set: function(x,y,d,v) {
        var ix = ((this.sx * y) + x)*this.depth+d;
        this.w[ix] = v;
       },
       add: function(x,y,d,v){
        var ix = ((this.sx * y)+x)*this.depth+d;  
        this.w[ix]+=v;
       },
       get_grad: function(x,y,d){
        var ix = ((this.sx*y)+x)*this.depth+d;
        return this.dw[ix];
       },
       set_grad: function(x,y,d,v){
        var ix = ((this.sx*y)+x)*this.depth+d;
        this.dw[ix] = v;
       },
       add_grad: function(x,y,d,v){
        var ix = ((this.sx*y)+x)*this.depth+d;
        this.dw[ix]+=v;
       },
       cloneAndZero: function() {return new Vol(this.sx, this.sy, this.depth, 0.0)},
       clone: function() {
        var V = new Vol(this.sx, this.sy, this.depth, 0.0);
        var n = this.w.length;
        for(var i = 0; i < n; i++) { V.w[i] = this.w[i];}
        return V; 
       },
       addFrom: function(V) {for(var k = 0; k<this.w.length;k++) {this.w[k] += V.w[k];}},
       addFromScaled : function(V,a){for (var k=0; k< this.w.length; k++){this.w[k]+=a*V.w[k];} },
       setConst: function(a) {for(var k=0; k<this.w.length;k++){this.w[k]=a;}},
       
       toJSON: function() {

         var json = {}
         json.sx = this.sx;
         json.sy = this.sy;
         json.depth = this.depth;
         json.w = this.w;

       },

       fromJSON: function(json){

        this.sx = json.sx;
        this.sy = json.sy;
        this.depth = json.depth;
        var n = this.sx*this.sy*this.depth;
        this.w = global.zeros(n);
        this.dw = global.zeros(n);
        for(var i = 0; i < n; i++){
            this.w[i] = json.w[i];
        }
       }

    }

    global.Vol = Vol;
})(neuralnetjs);