import { Vector } from "../../helpers.js";
import { Mesh_Effect_Particle } from "../effect.js";
import { Mesh_Effect_Base } from "./base.js";

export default class effect extends Mesh_Effect_Base {

    static textures = [
        [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3],
        [0, 4], [1, 4], [2, 4], [3, 4]
    ];

    constructor(pos, params) {
        super(pos, params);
        const {texture, texture_index} = this.getTexture(effect.textures);
        pos.addScalarSelf(
            (Math.random() - Math.random()) * .3,
            .35 + .25 * Math.random(),
            (Math.random() - Math.random()) * .3
        );
        //
        return new Mesh_Effect_Particle(null, pos, texture, 5, false, 0, 0.0075 + (0.0075 * Math.random()), new Vector(0, 100, 0));
    }

}