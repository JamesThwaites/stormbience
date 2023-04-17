
var params = {
    fullscreen: true
};

var strikes = [];
var frame_count = 0;

const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

var elem = document.body;
var two = new Two(params).appendTo(elem);

var background = two.makeRectangle(vw/2,vh/2,vw,vh);
background.fill = rgb(0,0,0);
two.update();

two.bind('update', update);


function rgb(x,y,z) {
    return 'rgb(' + x.toString() + ',' + y.toString() + ',' + z.toString() + ')'
}

function rand_between(min,max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

class Vertex {

    main = 0;
    branch_top = -1;
    hg_child = -1;
    branch_len = -1;
    children = [];

    constructor(x, y, generation, parent) {
        this.x = x;
        this.y = y;
        this.generation = generation;
        this.parent = parent;
    }

    point_in_dir(pos, strokelen) {
        var dist = this.dist_to(pos);
        var unit = [(pos[0] - this.x)/dist, (pos[1] - this.y)/dist];

        return [this.x + unit[0]*strokelen, this.y + unit[1]*strokelen];
    }

    dist_to(pos) {
        return Math.sqrt((this.x - pos[0])**2 + (this.y - pos[1])**2);
    }

    add_child(child) {
        this.children.push(child);
    }

    set_hg(hg) {
        if (this.parent == null) {
            return;
        }
        if (this.hg_child > hg) {
            return;
        }
        this.hg_child = hg;
        this.parent.set_hg(hg);
    }

    set_branch_top(gen) {
        if (this.main == 1) {
            this.branch_top = 0;
        }
        else {
            this.branch_top = gen;
        }
        this.branch_len = this.hg_child - this.branch_top;
        
        if (this.children.length == 0) {
            return;
        }

        if (this.children.length >= 1) {
            for (var v of this.children) {
                if (v.hg_child == this.hg_child) {
                    v.set_branch_top(gen);

                } else {
                    v.set_branch_top(v.generation);
                }
            }
            
        }
    }
}

function generate() {
    
    console.log(vw, vh);


    var vertices = [];
    var baseline = 0;
    var root = new Vertex(rand_between(100, vw - 100), 0, 0, null);

    vertices.push(root);
    var count = 0;

    while (vertices[vertices.length - 1].y < vh - vh/10) {
        //console.log(vertices.length);
        var randpos = [rand_between(0, vw), rand_between(Math.sqrt(Math.max(0, baseline - 100)), vh**0.5 + 1)**2];
        
        var n = 10000;
        var nv = vertices[0];

        for (var v of vertices) {
            //console.log(v);
            if (v.dist_to(randpos) < n) {
                nv = v;
                n = v.dist_to(randpos);
            }
        }
        //console.log(nv);
        //console.log(randpos);
        var new_point = nv.point_in_dir(randpos, 30);
        //console.log(new_point);
        var new_vertex = new Vertex(new_point[0], new_point[1], nv.generation + 1, nv);
        nv.add_child(new_vertex);
        vertices.push(new_vertex);

        baseline = Math.max(new_point[1], baseline);
        //console.log(baseline);
        count++;
    }
    


    var grounders = [];
    for (v of vertices) {
        if (v.y >= vh - vh/10) {
            grounders.push(v);
        }
    }

    var hg = 1000;
    var hh = 0;
    var first_grounder = null;
    for (g of grounders) {
        if (g.generation < hg || (g.generation == hg && g.y > hh)) {
            hg = g.generation;
            hh = g.y;
            first_grounder = g;
        }
    }

    var cursor = first_grounder;
    while (cursor != null) {
        cursor.main = 1;
        cursor = cursor.parent;
    }

    // first bfs
    var gen_maxes = [];
    
    var cg = [root];
    var ng = []
    while (cg.length > 0) {
        var gm = 0;
        for (v of cg) {
            gm = Math.max(gm, v.y);
            if (v.children.length == 0) {
                v.set_hg(v.generation);

            } else {
                ng = ng.concat(v.children);
            }
        }
        gen_maxes.push(gm);
        cg = [...ng];
        ng = [];
    }
    root.set_branch_top(0);
    //console.log(vertices);

    cols = {};
    lens = new Set();
    for (v of vertices) {
        lens.add(v.branch_len);
    }

    for (l of lens) {
        cols[l] = rgb(rand_between(100,255), rand_between(100,255), rand_between(100,255))
    }

    var strike = []
    var colour = [209, 179, 193];
    var strikelen = first_grounder.generation + 100;

    strikenum = rand_between(2, 5);
    thickness = 8
    td = 12
    fsl = td*2
    tdc = 0
    tdcc = 0

    for (v of vertices) {
        if (v.parent != null) {
            var temp = two.makeLine(v.x, v.y, v.parent.x, v.parent.y);
            temp.stroke = rgb(0,0,0);

            var strokeinfo = [temp, []]

            for (var i = 0; i <= strikelen; i++) {
                var frame = []
                if (i < v.generation) {
                    strokeinfo[1].push([rgb(0,0,0), 1, 0]);

                } else if (i >= first_grounder.generation) {
                    if (v.main == 0) {
                        strokeinfo[1].push([rgb(0,0,0), 1, 0]);

                    } else {
                        opacity = 1
                        if (i - first_grounder.generation < fsl) {
                            brightness = 255;
                        } else if (i == strikelen) {
                            brightness = 0;
                            opacity = 0
                        } else {
                            brightness = 255.0 * 2.7183**(-(i-first_grounder.generation+fsl)/40);
                        }
                        strokeinfo[1].push([rgb(brightness,brightness,brightness), thickness, opacity]);
                    }
                    

                } else {
                    global_factor = 0.7 + (gen_maxes[i]/vh);
                    age_factor = Math.max(0.7, 1.0 - 0.0005 * (Math.max(0, i - v.generation)**2));
                    bsize_factor = Math.min(1.0, 0.5 + v.branch_len/strikelen);
                    bpos_factor = Math.max(1, 2.0*(v.branch_len - (Math.min(v.hg_child, i) - v.generation))/v.branch_len);
                    bage_factor = Math.max(0.0,1.0 - (Math.max(0,i - v.branch_top))/(v.branch_len*1.5));

                    f = global_factor*age_factor*bsize_factor*bpos_factor*bage_factor*1.8;
                    
                    frame.push(rgb(Math.floor(colour[0]*f), Math.floor(colour[1]*f), Math.floor(colour[2]*f)));
                    frame.push(1);
                    frame.push(1);
                    strokeinfo[1].push([...frame]);
                }
            }
            strike.push([...strokeinfo]);
            
        }
    }
    strike.unshift(strikelen);
    if (frame_count + strikelen >= 1000) {
        strike.unshift((frame_count + strikelen) % 1000);
    } else {
        strike.unshift(frame_count);
    }
    

    strikes.push([...strike]);

    two.update();
}

function update() {
    frame_count++;
    if (frame_count == 1000) {
        frame_count = 0;
    }
    background.fill = rgb(0,0,0);
    for (strike of strikes) {
        if (frame_count >= strike[0] && frame_count <= strike[0] + strike[1]) {
            for (var i = 2; i < strike.length; i++) {
                strike[i][0].stroke = strike[i][1][frame_count-strike[0]][0];
                strike[i][0].linewidth = strike[i][1][frame_count-strike[0]][1];
                strike[i][0].opacity = strike[i][1][frame_count-strike[0]][2];
            }
        }
        if (frame_count >= strike[0] + strike[1] - 104 && frame_count <= strike[0] + strike[1] - 98) {
            closeness = frame_count - (strike[0] + strike[1] - 104);
            bloom_brightness = rgb(Math.floor(209*0.4*closeness), Math.floor(179*0.4*closeness), Math.floor(193*0.4*closeness))
            //console.log(closeness, bloom_brightness);
            background.fill = bloom_brightness;
        }
    }
}

generate();
two.play();