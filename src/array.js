const {isArray} = require('core-util-is')
const {sort} = require('array-timsort')

const {
  SYMBOL_PREFIXES,

  UNDEFINED,

  symbol,
  copy_all_comments,
  swap_comments
} = require('./common')


const reverse_comments = array => {
  const {length} = array
  let i = 0
  const max = length / 2

  for (; i < max; i ++) {
    swap_comments(array, i, length - i - 1)
  }
}

const move_comment = (target, source, i, offset, remove) => {
  copy_all_comments(target, source, i + offset, i, remove)
}

const move_comments = (
  // `Array` target array
  target,
  // `Array` source array
  source,
  // `number` start index
  start,
  // `number` number of indexes to move
  count,
  // `number` offset to move
  offset,
  // `boolean` whether should remove the comments from source
  remove
) => {
  if (offset > 0) {
    let i = count
    //         |   count   | offset |
    // source: -------------
    // target:          -------------
    //         | remove |
    // => remove === offset

    // From [count - 1, 0]
    while (i -- > 0) {
      move_comment(target, source, start + i, offset, remove && i < offset)
    }
    return
  }

  let i = 0
  const min_remove = count + offset
  // | remove  |  count    |
  //           -------------
  // -------------
  //             | offset  |

  // From [0, count - 1]
  while (i < count) {
    const ii = i ++
    move_comment(target, source, start + ii, offset, remove && i >= min_remove)
  }
}

class CommentArray extends Array {
  // - deleteCount + items.length

  // We should avoid `splice(begin, deleteCount, ...items)`,
  // because `splice(0, undefined)` is not equivalent to `splice(0)`,
  // as well as:
  // - slice
  splice (...args) {
    const {length} = this
    const ret = super.splice(...args)

    // #16
    // If no element removed, we might still need to move comments,
    //   because splice could add new items

    // if (!ret.length) {
    //   return ret
    // }

    // JavaScript syntax is silly
    // eslint-disable-next-line prefer-const
    let [begin, deleteCount, ...items] = args

    if (begin < 0) {
      begin += length
    }

    if (arguments.length === 1) {
      deleteCount = length - begin
    } else {
      deleteCount = Math.min(length - begin, deleteCount)
    }

    const {
      length: item_length
    } = items

    // itemsToDelete: -
    // itemsToAdd: +
    //        |    dc      |  count   |
    // =======-------------============
    // =======++++++============
    //        | il |
    const offset = item_length - deleteCount
    const start = begin + deleteCount
    const count = length - start

    move_comments(this, this, start, count, offset, true)

    return ret
  }

  slice (...args) {
    const {length} = this
    const array = super.slice(...args)
    if (!array.length) {
      return new CommentArray()
    }

    let [begin, before] = args

    // Ref:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
    if (before === UNDEFINED) {
      before = length
    } else if (before < 0) {
      before += length
    }

    if (begin < 0) {
      begin += length
    } else if (begin === UNDEFINED) {
      begin = 0
    }

    move_comments(array, this, begin, before - begin, - begin)

    return array
  }

  unshift (...items) {
    const {length} = this
    const ret = super.unshift(...items)
    const {
      length: items_length
    } = items

    if (items_length > 0) {
      move_comments(this, this, 0, length, items_length, true)
    }

    return ret
  }

  shift () {
    const ret = super.shift()
    const {length} = this

    move_comments(this, this, 1, length, - 1, true)

    return ret
  }

  reverse () {
    super.reverse()

    reverse_comments(this)

    return this
  }

  pop () {
    const ret = super.pop()

    // Removes comments
    const {length} = this
    SYMBOL_PREFIXES.forEach(prefix => {
      const prop = symbol(prefix, length)
      delete this[prop]
    })

    return ret
  }

  concat (...items) {
    let {length} = this
    const ret = super.concat(...items)

    if (!items.length) {
      return ret
    }

    items.forEach(item => {
      const prev = length
      length += isArray(item)
        ? item.length
        : 1

      if (!(item instanceof CommentArray)) {
        return
      }

      move_comments(ret, item, 0, item.length, prev)
    })

    return ret
  }

  sort (...args) {
    const result = sort(
      this,
      // Make sure there is no more than one argument
      ...args.slice(0, 1)
    )

    // For example,
    // if we sort ['c', 'a', 'b', 'd'],
    // then `result` will be [1, 2, 0, 3], and the array is ['a', 'b', 'c', 'd']

    // First, we swap index 0 and index 1, then the array comments are
    // ['a.comments', 'c.comments', 'b.comments', 'd.comments']

    // Then swap index 1 and index 2
    // ['a.comments', 'b.comments', 'c.comments', 'd.comments']

    // And we should not swap index 2 and index 0

    const sorted = new Set()

    result.forEach((new_index, original_index) => {
      if (new_index === original_index) {
        return
      }

      if (sorted.has(new_index) && sorted.has(original_index)) {
        return
      }

      sorted.add(new_index)
      sorted.add(original_index)

      swap_comments(this, new_index, original_index)
    })
  }
}

module.exports = {
  CommentArray
}
