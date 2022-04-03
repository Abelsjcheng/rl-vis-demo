
export function splitLinkName(name) {
    let arr = name.split(':')
    return arr.length !== 1 ? arr.slice(1).join('') : name
}
export function splitNodeName(name) {
    let arr = name.split('_')
    return arr.length !== 1 ? arr.slice(1).join('_') : name
}