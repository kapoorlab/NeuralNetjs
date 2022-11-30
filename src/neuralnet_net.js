(function(global){
    
var assert = global.assert;

var Net = function(options) {

    this.layers = [];
}
    


Net.prototype = {

    makeLayers: function(defs) {

        assert(defs.length >=2, 'At least one input layer and loss layer are required');
        assert(defs[0].type === 'Input', 'First layer must be the input layer');

        var desugar = function() {

            var new_defs = []
            for(var i=0; i<defs.length;i++){

                 var def = defs[i]

                 if(def.type==='softmax_sigmoid'){
                    new_defs.push({type:'conv', num_neurons:def.num_classes + def.num_boxvector})
                 }

                 if(def.type==='softmax' || def.type ==='svm'){

                    new_defs.push({type:'fc', num_neurons:def.num_classes});
                 }

                 if(def.type==='convsoftmax'){

                    new_defs.push({type:'conv', num_neurons:def.num_classes });
                 }
                
                 if(def.type==='regression'){

                    new_defs.push({type:'fc', num_neurons:def.num_neurons});
                 } 
                 if((def.type==='fc'||def.type==='conv') && typeof(def.bias_pref)==='undefined'){
                    def.bias_pref = 0.0;
                    if(typeof def.activation!== 'undefined' && def.activation === 'relu') {
                        def.bias_pref = 0.1;
                    }
                 }
                
                 new_defs.push(def); 


                 if (typeof def.activation !== 'undefined') {

                    if (def.activation==='relu') {new_defs.push({type:'relu'});}
                    else if (def.activation==='sigmoid'){new_defs.push({type:'sigmoid'});}
                    else if (def.activation==='tanh'){new_defs.push({type:'tanh'});}
                    else if (def.activation==='maxout') {
                        var gs = def.group_size!=='undefined'?def.group_size:2;
                        new_defs.push({type:'maxout', group_size:gs});
                    }
                    else { console.log('Unsupported activation' + def.activation); }

                }
                if(typeof def.drop_prob!=='undefined' && def.type!=='dropout') {

                    new_defs.push({type:'dropout', drop_prob: def.drop_prob});
                }

            }

            return new_defs;

            }


            defs = desugar(defs)

            this.layers = [];
            for (var i = 0; i< defs.length; i++) {

                     var def = defs[i];
                     if(i>0) {

                         var prev = this.layers[i-1];
                         def.in_sx = prev.out_sx;
                         def.in_sy = prev.out_sy;
                         def.in_depth = prev.out_depth;
                     }

                     switch(def.type){

                        case 'fc': this.layers.push(new global.FullyConnLayer(def)); break;
                        case 'conv': this.layers.push(new global.ConvLayer(def)); break;
                        case 'softmax': this.layers.push(new global.SoftmaxLayer(def)); break;
                        case 'convsoftmax': this.layers.push(new global.ConvSoftmaxLayer(def)); break;
                        case 'softmax_sigmoid': this.layers.push(new global.SoftmaxSigmoidComboLayer(def)); break;
                        case 'regression': this.layers.push(new global.RegressionLayer(def)); break;
                        case 'pool': this.layers.push(new global.PoolLayer(def)); break;
                        case 'relu': this.layers.push(new global.ReluLayer(def)); break;
                        case 'sigmoid': this.layers.push(new global.SigmoidLayer(def)); break;
                        case 'tanh': this.layers.push(new global.TanhLayer(def)); break;
                        case 'svm': this.layers.push(new global.SVMLayer(def)); break;
                        case 'lrn': this.layers.push(new global.LocalResponseNormalizationLayer(def)); break;
                        case 'dropout': this.layers.push(new global.DropoutLayer(def)); break;
                        case 'input': this.layers.push(new global.InputLayer(def)); break;
                        case 'maxout': this.layers.push(new global.MaxoutLayer(def)); break;
                        default: console.log('ERROR: UNRECOGNIZED LAYER TYPE: ' + def.type);
                     }

            }

        },

        forward: function(V, is_training) {

             if(typeof(is_training)==='undefined') is_training = false;
             var act = this.layers[0].forward(V, is_training);
             for(var i = 1; i<this.layers.length;i++) {
                act = this.layers[i].forward(act, is_training);
             }
             return act;

        },

        backward: function(y) {
             var N = this.layers.length;
             var loss = this.layers[N-1].backward(y);
             for(var i = N-2; i >=0; i--) {
                this.layers[i].backward();
             }
             return loss;

        },

        getCostLoss: function(V,y) {

            this.forward(V, false);
            var N = this.layers.length;
            var loss = this.layers[N - 1].backward(y);

            return loss;
        },
        getParamsAndGrads: function(){

            var response = [];
            for(var i = 0; i<this.layers.length;i++){
                var layer_response = this.layers[i].getParamsAndGrads();
                for(var j = 0;j < layer_response.length;j++){

                    response.push(layer_response[j]);
                }
            }

            return response;
        },  

        getPrediction: function(num_classes){
             
             var S = this.layers[this.layers.length-1];
             assert(S.layer_type === 'softmax' || S.layer_type === 'convsoftmax' || S.layer_type === 'softmax_sigmoid', 'getPrediction function assumes softmax or mixture of the two');
             
             var pclass = []
             for (var i = 0; i < num_classes; i++) {
             
                pclass.push(S.out_act.w[i])
            }
             
            var maxv = p[0];
            var maxi = 0;
            for(var i=1;i<pclass.length;i++) {
                if(pclass[i] > maxv) { maxv = pclass[i]; maxi = i;}
            }
            return maxi; // return index of the class with highest class probability
            },
            toJSON: function() {

                var json = {};
                json.layers = [];
                for(var i = 0; i<this.layers.length;i++){
                    json.layers.push(this.layers[i].toJSON());
                }
                return json;

            },

            fromJSON: function(json) {

                this.layers = [];
                for(var i = 0; i < json.layers.length; i++) {

                    var Lj = json.layers[i];
                    var t = Lj.layer_type;
                    var L;
                    if(t==='input') {L = new global.InputLayer();}
                    if(t==='conv') {L = new global.ConvLayer();}
                    if(t==='sigmoid'){L = new global.SigmoidLayer();}
                    if(t==='softmax'){L = new global.SoftmaxLayer();}
                    if(t==='softmax_sigmoid'){L = new global.SoftmaxSigmoidComboLayer();}
                    if(t==='convsoftmax'){L = new global.ConvSoftmaxLayer();}
                    if(t==='regression') { L = new global.RegressionLayer(); }
                    if(t==='fc') { L = new global.FullyConnLayer(); }
                    if(t==='maxout') { L = new global.MaxoutLayer(); }
                    if(t==='svm') { L = new global.SVMLayer(); }
                    if(t==='pool') { L = new global.PoolLayer(); }
                    if(t==='lrn') { L = new global.LocalResponseNormalizationLayer(); }
                    if(t==='tanh') { L = new global.TanhLayer(); }
                    if(t==='dropout') { L = new global.DropoutLayer(); }
                }
            }

        }
global.Net = Net;

})(neuralnetjs);