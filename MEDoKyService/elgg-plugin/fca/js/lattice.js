lattice = {
  backend : undefined,
  offset : 0.05,
  renderer : undefined,
  sys : undefined,
  done : false,
  info : {},
  canvas : {},
  initial : true,
  latticeview : false,
  taxonomy_edges : [],
  node_top : {},
  node_bot : {},
  lo_shown : false,

  init_canvas : function(canvas, width, height, info, backend) {
    $(canvas).prop("width", width);
    $(canvas).prop("height", height);
    $(info).height($(canvas).prop("height"));
    lattice.canvas = $(canvas).get(0);
    lattice.info = $(info).get(0);
    lattice.backend = backend;
  },

  resize : function(width, height) {
    if (lattice.sys) {
      $(lattice.canvas).prop("width", width);
      $(lattice.canvas).prop("height", height);
      $(lattice.info).height($(lattice.canvas).prop("height"));
      lattice.sys.screenSize(lattice.canvas.width, lattice.canvas.height);
      lattice.renderer.redraw();
    }
  },

  init_renderer : function() {
    var ctx = lattice.canvas.getContext("2d");
    var particleSystem;

    lattice.renderer = {
      init : function(system) {
        particleSystem = system;
        particleSystem.screenSize(lattice.canvas.width, lattice.canvas.height);
        particleSystem.screenPadding(50);
        lattice.renderer.initMouseHandling();
      },

      redraw : function() {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, lattice.canvas.width, lattice.canvas.height);
        try {

          particleSystem.eachEdge(lattice.paint_edge);
          particleSystem.eachNode(lattice.paint_node);
        } catch (not_inited) {
        }
      },

      initMouseHandling : lattice.init_mouse
    };
  },

  init_particelsystem : function() {
    lattice.sys = arbor.ParticleSystem(1000, 1500, 0.95);
    lattice.sys.parameters({
      gravity : true,
      fps : 24,
      precision : 0
    });
    lattice.sys.renderer = lattice.renderer;
  },

  init_mouse : function() {
    var dragged = null;
    var handler = {
      clicked : function(e) {
        var pos = $(lattice.canvas).offset();
        _mouseP = arbor.Point(e.pageX - pos.left, e.pageY - pos.top);
        dragged = lattice.sys.nearest(_mouseP);
        if (lattice.latticeview || dragged.node.data.enabled) {
          if (dragged && dragged.node !== null) {
            dragged.node.fixed = true;
          }
          $(lattice.info).empty();
          if (!dragged.node.data.active || dragged.node.data.selected || lattice.initial) {
            lattice.initial = false;
            lattice.sys.eachNode(function(_n, ___pt) {
              _n.data.active = false;
              _n.data.objActive = false;
              _n.data.attrActive = false;
              _n.data.selected = false;
            });
            lattice.sys.eachEdge(function(_e, _pt1, _pt2) {
              _e.data.active = false;
            });
            lattice.enable_upper(lattice.sys.getEdgesFrom(dragged.node));
            // for ( var xyz in lattice.sys.getEdgesTo(dragged.node)) {
            // console.debug(lattice.sys.getEdgesTo(dragged.node)[xyz]);
            // }
            lattice.enable_lower(lattice.sys.getEdgesTo(dragged.node));
            dragged.node.data.objActive = true;
            dragged.node.data.attrActive = true;
          } else {
            lattice.sys.eachNode(function(_n, ___pt) {
              _n.data.selected = false;
            });
          }
          dragged.node.data.active = true;
          dragged.node.data.selected = true;
          for ( var c in state.domain.formalContext.concepts) {
            if (state.domain.formalContext.concepts[c].id == dragged.node.data.conceptid) {
              lattice.update_info(c);
            }
          }

          $(lattice.canvas).bind('mousemove', handler.dragged);
          $(window).bind('mouseup', handler.dropped);
          return false;
        }
      },
      dragged : function(e) {
        var pos = $(lattice.canvas).offset();
        var s = arbor.Point(e.pageX - pos.left, e.pageY - pos.top);
        if (dragged && dragged.node !== null) {
          var p = lattice.sys.fromScreen(s);
          if (!dragged.node.data.fixed)
            dragged.node.p = p;
        }
        return false;
      },
      dropped : function(e) {
        if (dragged === null || dragged.node === undefined)
          return;

        if (dragged.node !== null && !dragged.node.data.fixed) {
          dragged.node.fixed = false;
        }
        // dragged.node.tempMass = 1000;
        dragged = null;
        $(lattice.canvas).unbind('mousemove', handler.dragged);
        $(window).unbind('mouseup', handler.dropped);
        _mouseP = null;
        return false;
      }
    };
    $(lattice.canvas).mousedown(handler.clicked);
  },

  init : function(sel_canvas, width, height, sel_info) {
    lattice.done = false;
    lattice.initial = true;
    $(sel_info).empty();
    $(sel_info).append("Select a node to display information about it.");

    lattice.init_canvas(sel_canvas, width, height, sel_info);
    if (lattice.renderer == undefined)
      lattice.init_renderer();
    if (lattice.sys == undefined)
      lattice.init_particelsystem();
    else {
      lattice.sys.screenSize(lattice.canvas.width, lattice.canvas.height);
      lattice.sys.parameters({
        repulsion : 1000,
        stiffness : 1500,
        friction : 0.95,
        precision : 0
      });
    }
    lattice.latticeview = true;
    lattice.taxonomy_edges = [];
  },

  reset_props : function() {
    $(lattice.info).empty();
    $(lattice.info).append("Select a node to display information about it.");
    lattice.done = false;
    lattice.initial = true;
    lattice.taxonomy_edges = [];
    // lattice.latticeview=true;
    // lattice.sys.screenSize(lattice.canvas.width, lattice.canvas.height);
    lattice.sys.parameters({
      repulsion : 1000,
      stiffness : 1500,
      friction : 0.95,
      precision : 0
    });
  },

  paint_node : function(node, pt) {

    if (lattice.latticeview || node.data.enabled) {

      var ctx = lattice.canvas.getContext("2d");
      var w = 10;
      if (node.data.obj == "" && node.data.attr == "")
        w = 2;
      if (node.data.selected) {
        ctx.fillStyle = "rgba(0,200,0,1)";
        ctx.closePath();
        ctx.beginPath();
        ctx.arc((pt.x), (pt.y), w + 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.closePath();
      }
      ctx.textAlign = "center";
      if (node.data.active)
        ctx.strokeStyle = "rgba(255,255,255, 1)";
      else
        ctx.strokeStyle = "rgba(255,255,255, 0.3)";
      ctx.beginPath();
      ctx.arc((pt.x), (pt.y), w, 0, 2 * Math.PI, true);
      ctx.lineWidth = 4;

      ctx.stroke();
      if (node.data.active)
        ctx.fillStyle = "rgba(255,255,255, 1)";
      else
        ctx.fillStyle = "rgba(255,255,255, 0.3)";
      ctx.fill();
      if (node.data.isObjectConcept) {
        ctx.closePath();
        ctx.beginPath();
        if (node.data.active)
          ctx.strokeStyle = "rgba(0,0,255,1)";
        else
          ctx.strokeStyle = "rgba(0,0,255,0.3)";
        ctx.lineWidth = 2;
        ctx.arc((pt.x), (pt.y), w, 0, 2 * Math.PI, true);
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        if (node.data.active)
          ctx.fillStyle = "rgba(0,0,255,1)";
        else
          ctx.fillStyle = "rgba(0,0,255,0.3)";
        ctx.arc((pt.x), (pt.y), w, 1 * Math.PI, 2 * Math.PI, true);
        ctx.fill();
        ctx.closePath();
      } else {

        if (node.data.active)
          ctx.strokeStyle = "rgba(0,0,0,1)";
        else
          ctx.strokeStyle = "rgba(0,0, 0,0.3)";

        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (node.data.objActive) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(255,255,255,1)";
        ctx.font = "bold 10pt sans-serif";
        ctx.strokeText(node.data.obj, pt.x, pt.y - 1.5 * w - 3);
        ctx.fillStyle = "rgba(0,0,0,1)";

        ctx.fillStyle = "black";
        ctx.fillText(node.data.obj, pt.x, pt.y - 1.5 * w - 3);
      }
      if (node.data.attrActive) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(255,255,255,1)";
        ctx.font = "bold 10pt sans-serif";
        ctx.strokeText(node.data.attr, pt.x, pt.y + 10 + 1.5 * w);
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.fillStyle = "black";
        ctx.fillText(node.data.attr, pt.x, pt.y + 10 + 1.5 * w);
      }
    }
  },

  paint_edge : function(edge, pt1, pt2) {
    if ((lattice.latticeview && !edge.data.taxonomy) || (edge.data.enabled)) {
      var ctx = lattice.canvas.getContext("2d");
      var offset = 15;
      if (edge.target.data.obj == "" && edge.target.data.attr == "")
        offset = 5;
      var arrow = 10 + offset;
      if (edge.data.active) {
        ctx.fillStyle = "rgba(255,255,255, 0.6)";
        ctx.strokeStyle = "rgba(255,255,255, 0.6)";
      } else {
        ctx.fillStyle = "rgba(255,255,255, 0.2)";
        ctx.strokeStyle = "rgba(255,255,255, 0.2)";
      }
      ctx.lineWidth = 4;
      ctx.beginPath();
      var angle = Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x);
      ctx.moveTo(pt1.x, pt1.y);
      ctx.lineTo(pt2.x - arrow * Math.cos(angle), pt2.y - arrow * Math.sin(angle));
      ctx.stroke();
      ctx.moveTo(pt2.x - offset * Math.cos(angle), pt2.y - offset * Math.sin(angle));
      ctx.beginPath();
      ctx.lineTo(pt2.x - arrow * Math.cos(angle - Math.PI / 20), pt2.y - arrow
          * Math.sin(angle - Math.PI / 20));
      // ctx.stroke();
      ctx.lineTo(pt2.x - arrow * Math.cos(angle + Math.PI / 20), pt2.y - arrow
          * Math.sin(angle + Math.PI / 20));
      ctx.lineTo(pt2.x - offset * Math.cos(angle), pt2.y - offset * Math.sin(angle));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (edge.data.active) {
        ctx.fillStyle = "rgba(0,0,0, 0.8)";
        ctx.strokeStyle = "rgba(0,0,0, 0.8)";
      } else {
        ctx.fillStyle = "rgba(200,200,200, 0.2)";
        ctx.strokeStyle = "rgba(200,200,200, 0.2)";
      }
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pt1.x, pt1.y);

      ctx.lineTo(pt2.x - (arrow) * Math.cos(angle), pt2.y - (arrow) * Math.sin(angle));
      ctx.stroke();
      ctx.moveTo(pt2.x - offset * Math.cos(angle), pt2.y - offset * Math.sin(angle));
      ctx.beginPath();
      ctx.lineTo(pt2.x - arrow * Math.cos(angle - Math.PI / 20), pt2.y - arrow
          * Math.sin(angle - Math.PI / 20));
      // ctx.stroke();
      ctx.lineTo(pt2.x - arrow * Math.cos(angle + Math.PI / 20), pt2.y - arrow
          * Math.sin(angle + Math.PI / 20));
      ctx.lineTo(pt2.x - offset * Math.cos(angle), pt2.y - offset * Math.sin(angle));
      ctx.closePath();
      ctx.fill();

      if (edge.source.p.y < edge.target.p.y) {
        if (lattice.done)
          return;
        edge.target.p.y = -lattice.offset;
      }
    }
  },

  enable_upper : function(edges) {
    for ( var n in edges) {
      lattice.enable_upper(lattice.sys.getEdgesFrom(edges[n].target));
    }
    for ( var n in edges) {
      edges[n].data.active = true;
      edges[n].target.data.active = true;
      edges[n].target.data.attrActive = true;
    }
  },

  enable_lower : function(edges) {
    for ( var n in edges) {
      lattice.enable_lower(lattice.sys.getEdgesTo(edges[n].source));
    }
    for ( var n in edges) {
      edges[n].data.active = true;
      edges[n].source.data.active = true;
      edges[n].source.data.objActive = true;
    }
  },

  switch_view : function() {
    lattice.latticeview = !lattice.latticeview;

    if (lattice.latticeview) {
      lattice.sys.eachEdge(function(edge, pt1, pt2) {
        if (edge.data.taxonomy)
          lattice.sys.pruneEdge(edge);
      });
      $("#dia_vis").dialog("option", "title", "Lattice for Domain '" + state.domain.name + "'");
    } else {
      $("#dia_vis").dialog("option", "title", "Taxonomy of '" + state.domain.name + "'");

    }
    // lattice.sys.eachNode(function(node) {
    // if (node != lattice.node_top || lattice.node_bot)
    // node.data.fixed = !lattice.latticeview;
    // });
    if (!lattice.latticeview) {
      for ( var e in lattice.taxonomy_edges) {
        // console.debug(e);
        var pre = lattice.sys.getNode(lattice.taxonomy_edges[e].source);
        var post = lattice.sys.getNode(lattice.taxonomy_edges[e].target);
        lattice.sys.addEdge(pre, post, {
          "active" : true,
          "enabled" : pre.data.enabled && post.data.enabled,
          "taxonomy" : true
        // pre.data.enabled && post.data.enabled
        });
      }
    }
    // lattice.sys.eachEdge(function(edge, pt1, pt2) {
    // if (edge.data.taxonomy)
    // edge.data.enabled = !lattice.latticeview;
    // });
    // lattice.reset_props();
    lattice.renderer.redraw();
  },

  update_info : function(c) {

    lattice.lo_shown = false;

    $(lattice.info).css({
      marginLeft : "0px",
      width : "210px"
    });

    $("#btn_show_lo").prop("src", state.basedir + "img/left_s.svg");

    console.debug(new Date().toString());
    var concept = state.domain.formalContext.concepts[c];
    var learningObjects = {};
    for ( var o in concept.objects) {
      concept.objects[o].learningObjects = state.backend_objects[concept.objects[o].id].learningObjects;
      for ( var lo in concept.objects[o].learningObjects) {
        learningObjects[concept.objects[o].learningObjects[lo].id] = concept.objects[o].learningObjects[lo];
      }
    }
    for ( var o in concept.attributes) {
      concept.attributes[o].learningObjects = state.backend_attributes[concept.attributes[o].id].learningObjects;
      for ( var lo in concept.attributes[o].learningObjects) {
        learningObjects[concept.attributes[o].learningObjects[lo].id] = concept.attributes[o].learningObjects[lo];
      }
    }

    console.debug(new Date().toString());
    var num_lo = Object.keys(learningObjects).length;

    var table = $(lattice.info).create("table", {
      style : "background-color: inherit; vertical-align: bottom; table-layout: auto"
    });
    var tr = table.create("tr", {
      style : "background-color: inherit"
    });

    // Name txt
    tr.create("td", {
      style : "background-color: inherit; width: 174px"
    }).append("Name:");

    // Edit icon
    var t_edit = tr.create("td", {
      style : "background-color: inherit"
    });
    t_edit.create("input", {
      id : "btn_concept_edit",
      "class" : "input",
      style : "border-width:0px; padding-left: 3px",
      type : "image",
      src : state.basedir + "img/edit.svg",
      width : "16px",
      height : "16px",
      onclick : "lattice.enable_editing()"
    });

    var rowspan;
    concept.objects.length > 0 ? rowspan = "6" : rowspan = "7";
    // learning object names
    for ( var lo in learningObjects) {
      tr.create("td", {
        rowspan : rowspan,
        class : "td_spacer, td_lo"
      }).create("input", {
        type : "button",
        class : "input lattice_lo col",
        style : "margin-left: -61px; margin-right: -61px; text-overflow: ellipsis; overflow: hidden;",
        value : learningObjects[lo].name
      }).data("url", learningObjects[lo].description).click(function() {
        window.open($(this).data("url"));
        // console.debug(learningObjects[lo].description);
      }).hover(function() {
        $(this).css("background-color", "rgba(255,255,255,1)");
      }, function() {
        $(this).css("background-color", "rgba(255,255,255,0.6)");
      });
    }

    // spacer
    tr.create("td", {
      "class" : "tr_spacer"
    });

    //
    //
    // next line
    tr = table.create("tr", {
      style : "background-color: inherit"
    });

    // input
    var t_name = tr.create("td", {
      style : "background-color: inherit",
      colspan : "2"
    });
    var input_name = t_name.create("input", {
      id : "input_concept_name",
      type : "text",
      value : concept.name
    }).prop("disabled", true);

    // spacer
    tr.create("td", {
      "class" : "tr_spacer"
    });

    //
    //
    // next line
    tr = table.create("tr", {
      style : "background-color: inherit"
    });

    // Description txt
    tr.create("td", {
      style : "background-color: inherit",
      colspan : "2"
    }).append("Description:");

    // spacer
    tr.create("td", {
      "class" : "tr_spacer"
    });

    //
    //
    // next line
    tr = table.create("tr", {
      style : "background-color: inherit"
    });

    // input
    var t_descr = tr.create("td", {
      style : "background-color: inherit",
      colspan : "2"
    });
    t_descr.create("input", {
      id : "input_concept_description",
      type : "text",
      value : concept.description
    }).prop("disabled", true);

    // spacer
    tr.create("td", {
      "class" : "tr_spacer"
    });

    //
    //
    // next line
    tr = table.create("tr", {
      style : "background-color: inherit"
    });

    // vertical space
    tr.create("td", {
      style : "background-color: inherit: height: 30px",
      colspan : "2"
    });

    // spacer
    tr.create("td", {
      "class" : "tr_spacer"
    });

    //
    //
    // next line
    tr = table.create("tr", {
      style : "background-color: inherit"
    });

    // Objects txt
    tr.create("td", {
      style : "background-color: inherit",
      colspan : "2"
    }).append(concept.objects.length > 0 ? "Objects:" : "(No Objects)");

    var btn_expand = tr.create("td", {
      rowspan : concept.objects.length + concept.attributes.length + 2,
      "class" : "tr_spacer",
      style : "vertical-align:middle"
    }).create("input", {
      type : "image",
      id : "btn_show_lo",
      class : "input",
      style : "border: none; height: 30px; width: 16px; margin-left: 5px; margin-right: 0px;",
      height : "30px",
      width : "16px",
      src : state.basedir + "img/right_s.svg"
    }).click(function() {
      if (!lattice.lo_shown) {
        $(".td_lo").show();
        $("#btn_lo_show").prop("disabled", true);
        $(".lattice_o_a").css("white-space", "nowrap");
        setTimeout(function() {
          $(".lattice_o_a").css("white-space", "normal");

          $("#btn_lo_show").prop("disabled", false);
        }, 290);
        t_edit.css("padding-right", "3px");
        t_name.css("padding-right", "3px");
        t_descr.css("padding-right", "3px");
        $("#btn_show_lo").prop("src", state.basedir + "img/left_s.svg");
        $(lattice.info).animate({
          marginLeft : "-" + num_lo * 28 + "px",
          width : "+=" + num_lo * 28 + "px"
        }, 300);
      } else {
        $(".td_lo").hide();
        $("#btn_lo_show").prop("disabled", false);
        $(".lattice_o_a").css("white-space", "normal");
        t_edit.css("padding-right", "0px");
        t_name.css("padding-right", "0px");
        t_descr.css("padding-right", "0px");
        $("#btn_show_lo").prop("src", state.basedir + "img/right_s.svg");
        $(lattice.info).animate({
          marginLeft : "0px",
          width : "210px"
        }, 300, function() {

          $("#btn_lo_show").prop("disabled", false);
        });
      }
      lattice.lo_shown = !lattice.lo_shown;
    });
    if (Object.keys(learningObjects).length == 0)
      btn_expand.hide();
    //
    //
    // next line
    if (concept.objects.length > 0)
      tr = table.create("tr", {
        style : "background-color: inherit"
      });
    for ( var o = 0; o < concept.objects.length; ++o) {
      var css = "vertical-align: middle; background-color: white; border-left:1px solid black; border-right:1px solid black;";
      if (o == 0)
        css += "; border-top: 1px solid black";
      if (o == concept.objects.length - 1)
        css += "; border-bottom: 1px solid black";
      tr.create("td", {
        id : "info_obj_" + concept.objects[o].id,
        colspan : "2",
        title : concept.objects[0].description,
        class : "lattice_o_a",
        style : css
      }).create("txt", " \u26ab " + concept.objects[o].name);
      for ( var lo in learningObjects) {
        var tmp = tr
            .create(
                "td",
                {
                  class : "td_spacer, td_lo",
                  style : "vertical-align: middle; border: 1px solid black; text-align: center; background-color: white"
                });

        for ( var ol in concept.objects[o].learningObjects) {
          if (concept.objects[o].learningObjects[ol].id == lo) {
            tmp.create("txt", "x");
          }
        }

      }
      if (o < concept.objects.length - 1) {
        tr = table.create("tr", {
          style : "background-color: inherit"
        });
      }
    }

    //
    //
    // next line
    tr = table.create("tr", {
      style : "background-color: inherit"
    });

    // Attributes txt
    tr.create("td", {
      style : "background-color: inherit",
      colspan : "2"
    }).append(concept.attributes.length > 0 ? "Attributes:" : "(No Attributes)");
    if (concept.objects.length > 0)
      for ( var lo in learningObjects) {
        tr.create("td", {
          class : "td_spacer, td_lo"
        });
      }

    tr.create("td", {
      "class" : "tr_spacer"
    });

    //
    //
    // next line
    if (concept.attributes.length > 0)
      tr = table.create("tr", {
        style : "background-color: inherit"
      });

    for ( var o = 0; o < concept.attributes.length; ++o) {
      var css = " vertical-align: middle; background-color: white; border-left:1px solid black; border-right:1px solid black;";
      if (o == 0)
        css += "; border-top: 1px solid black";
      if (o == concept.attributes.length - 1)
        css += "; border-bottom: 1px solid black";
      tr.create("td", {
        id : "info_obj_" + concept.attributes[o].id,
        colspan : "2",
        class : "lattice_o_a",
        title : concept.attributes[o].id,
        style : css
      }).create("txt", " \u26ab " + concept.attributes[o].name);

      for ( var lo in learningObjects) {
        var tmp = tr
            .create(
                "td",
                {
                  class : "td_spacer, td_lo",
                  style : "vertical-align:middle; border: 1px solid black; text-align: center; background-color:white"
                });

        for ( var ol in concept.attributes[o].learningObjects) {
          if (concept.attributes[o].learningObjects[ol].id == lo) {
            tmp.create("txt", "x");
          }
        }
      }
      if (o < concept.attributes.length - 1) {
        tr = table.create("tr", {
          style : "background-color: inherit"
        });
      }
    }

    $(".td_lo").hide();

    var tr = $(lattice.info).create("table", {
      style : "background-color: inherit"
    }).create("tr", {
      style : "background-color: inherit"
    });

    tr.create("td", {
      style : "width:20px; background-color: inherit"
    }).create("input", {
      id : "cb_concept_taxonomy",
      type : "checkbox"
    }).prop("checked", concept.partOfTaxonomy).prop("disabled", true);
    tr.create("td", {
      style : "background-color: inherit"
    }).append("Part of Taxonomy");
    $(lattice.info).create("input", {
      id : "btn_concept_save",
      type : "button",
      "class" : "input",
      style : "position: absolute; bottom: 0; left: 0; right: 0; margin-bottom: 10px",
      value : "Save",
      onclick : "lattice.update_concept(" + c + ")"
    }).hide();
  },

  enable_editing : function() {
    $("#btn_concept_edit").prop("disabled", true);
    $("#input_concept_name").prop("disabled", false);
    $("#input_concept_description").prop("disabled", false);
    $("#cb_concept_taxonomy").prop("disabled", false);
    $("#btn_concept_save").show();
  },
  disable_editing : function() {
    $("#btn_concept_edit").prop("disabled", false);
    $("#input_concept_name").prop("disabled", true);
    $("#input_concept_description").prop("disabled", true);
    $("#cb_concept_taxonomy").prop("disabled", true);
    $("#btn_concept_save").hide();
    lattice.renderer.redraw();
  },

  update_concept : function(c) {

    var concept = state.domain.formalContext.concepts[c];
    var partOfTaxonomy = concept.partOfTaxonomy;
    // concept.id = domainconcept.id;
    concept.name = $("#input_concept_name").get(0).value;
    concept.description = $("#input_concept_description").get(0).value;
    concept.partOfTaxonomy = $("#cb_concept_taxonomy").prop("checked");
    concept.index = c;
    concept.domainId = state.domain.id;
    // console.debug($("#cb_concept_taxonomy").prop("checked"));
    // domainconcept.name = concept.name;
    // domainconcept.description = concept.description;
    lattice.sys.getNode(concept.id).data.obj = concept.name;
    lattice.sys.getNode(concept.id).data.attr = concept.description;
    backend.update_concept(JSON.stringify(concept), function(formalContext) {
      if (concept.partOfTaxonomy != partOfTaxonomy) {
        state.domain.formalContext = formalContext;
        lattice.update_vis(state.domain);
      } else
        lattice.disable_editing();
    });
    lattice.renderer.redraw();
  },

  update_vis : function(domain) {
    // console.debug("update");
    // console.debug(domain);
    state.domain = domain;
    lattice.reset_props();
    lattice.draw();
    lattice.disable_editing();
  },

  create_node : function(concept, mass, y, x, fixed, color) {
    var sys = lattice.sys;

    var pre;
    if (y) {
      if (x) {
        pre = sys.addNode(concept.id, {
          "color" : color ? color : "grey",
          "shape" : "dot",
          "isObjectConcept" : concept.objectConcept,
          "mass" : mass ? mass : 1,
          "y" : y,
          "x" : x,
          "conceptid" : concept.id,
          "active" : true,
          "fixed" : fixed ? fixed : false,
          "enabled" : true
        });
      } else
        pre = sys.addNode(concept.id, {
          "color" : color ? color : "grey",
          "shape" : "dot",
          "isObjectConcept" : concept.objectConcept,
          "mass" : mass ? mass : 1,
          "y" : y,
          "conceptid" : concept.id,
          "active" : true,
          "fixed" : fixed ? fixed : false,
          "enabled" : true
        });
    } else {
      if (x) {

        pre = sys.addNode(concept.id, {
          "color" : color ? color : "grey",
          "shape" : "dot",
          "isObjectConcept" : concept.objectConcept,
          "mass" : mass ? mass : 1,
          "x" : x,
          "conceptid" : concept.id,
          "active" : true,
          "fixed" : fixed ? fixed : false,
          "enabled" : true
        });
      } else
        pre = sys.addNode(concept.id, {
          "color" : color ? color : "grey",
          "shape" : "dot",
          "conceptid" : concept.id,
          "isObjectConcept" : concept.objectConcept,
          "mass" : mass ? mass : 1,
          "active" : true,
          "fixed" : fixed ? fixed : false,
          "enabled" : true
        });
    }
    return pre;
  },

  draw_node : function(concept, y) {
    var sys = lattice.sys;

    var pre;
    if (sys.getNode(concept.id))
      pre = sys.getNode(concept.id);
    else
      pre = lattice.create_node(concept, 1, y);
    pre.data.isObjectConcept = concept.objectConcept;
    pre.data.enabled = concept.partOfTaxonomy;
    pre.data.obj = concept.name;
    pre.data.attr = concept.description;

  },

  draw_edge : function(concept, y) {
    var arr = concept.successors;
    var successors = util.unique(arr.concat(concept.taxonomySuccessors));
    // lattice.latticeview ? (concept.successors) :
    // (concept.taxonomySuccessors);
    var sys = lattice.sys;
    // console.debug("draw " + concept.name);
    var pre = sys.getNode(concept.id);
    for ( var s in successors) {
      // console.debug("Successor: " + successors[s].name);
      var post = sys.getNode(successors[s].id);
      if (post) {
        var isTaxonomy = (!util.containsConcept(concept.successors, successors[s]))
            && (util.containsConcept(concept.taxonomySuccessors, successors[s]));
        post.p.y = y;
        // if (isTaxonomy)
        // console.debug(concept.name + " to " + successors[s].name + "is a
        // taxonomy edge");
        // else
        // console.debug(concept.name + " to " + successors[s].name + "is a
        // regular edge");
        if (!isTaxonomy) {
          sys.addEdge(pre, post, {
            "active" : true,
            "enabled" : (pre.data.enabled && post.data.enabled) && !isTaxonomy,
            "taxonomy" : isTaxonomy
          // pre.data.enabled && post.data.enabled
          });
        } else {
          lattice.taxonomy_edges.push({
            "source" : concept.id,
            "target" : successors[s].id
          });
        }
      }
    }

  },

  draw : function() {

    $(lattice.info).css({
      marginLeft : "0px",
      width : "210px"
    });
    lattice.sys.eachEdge(function(edge, pt1, pt2) {
      lattice.sys.pruneEdge(edge);
    });
    lattice.sys.eachNode(function(node, pt) {
      lattice.sys.pruneNode(node);
    });
    // lattice.latticeview = true;
    var concepts = state.domain.formalContext.concepts;
    // console.debug(concepts);
    // lattice.sys.stop();
    // var bot = state.domain.formalContext.bottom;
    var y = concepts.length > 10 ? 10 : 5;

    var first = true;
    for ( var c in concepts) {

      // console.debug("concept " + concepts[c].name + " is part fo taxonomy");
      if (first) {
        var botnode = lattice.create_node(concepts[c], 2, y, 0.5, true);
        botnode.data.fixed = true;
        lattice.node_bot = botnode;
      } else if (concepts[c].successors.length == 0) {
        var topnode = lattice.create_node(concepts[c], 2, 0, 0.5, true);
        topnode.data.fixed = true;
        lattice.node_top = topnode;
      }
      lattice.draw_node(concepts[c], y);

      y -= 0.1;
      first = false;
    }
    y = concepts.length > 10 ? 10 : 5;
    for ( var c in concepts) {
      // if (lattice.latticeview || concepts[c].partOfTaxonomy)
      lattice.draw_edge(concepts[c], y);
      y -= 0.05;
    }
    // lattice.switch_view();
    setTimeout(function() {
      lattice.sys.parameters({
        repulsion : 400,
        precision : 0.9,
        stiffenss : 3000
      });
      lattice.done = true;

    }, 1500);

    for ( var i = 0; i < 100; ++i) {
      setTimeout(function() {
        if (!lattice.done) {
          lattice.sys.parameters({
            repulsion : 1500 - i * 10
          });
        }
      }, i * 50);
    }

  }
};
