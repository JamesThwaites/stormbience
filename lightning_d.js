
var params = {
    fullscreen: true
};

const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

var elem = document.body;
var two = new Two(params).appendTo(elem);

var background = two.makeRectangle(vw/2,vh/2,vw,vh);
background.fill = rgb(0,0,0);
two.update();


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

    for (v of vertices) {
        if (v.parent != null) {
            var temp = two.makeLine(v.x, v.y, v.parent.x, v.parent.y);
            
            if (v.main == 1) {
                temp.stroke = rgb(0,255,255);
            } else {
                temp.stroke = cols[v.branch_len]
            }
            
            
        }
    }
    two.update();
}

generate();