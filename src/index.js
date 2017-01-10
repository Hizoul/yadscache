import { isNil, isString, isArray, isFunction, cloneDeep, pull, each } from 'lodash'

class cUcache {
  constructor() {
    this.storage = null
    this.submitter = null
    this.storageKey = `cache.json`
    this.logToConsole = false
    this.parser = null
  }
  log(msg, data) {
    if (this.logToConsole) {
      console.log(msg, data)
    }
  }
  setStorage(ns) {
    this.storage = ns
  }
  setSubmitter(ns) {
    this.submitter = ns
  }
  setParser(ns) {
    this.parser = ns
  }
  get(cb) {
    this.storage.getItem(this.storageKey, cb)
  }
  getParsed(cb) {
    this.get((fErr, savedVal) => {
      if (!isNil(fErr)) {
        this.log(`error getting item`, fErr)
        if (isFunction(cb)) {
          cb(fErr)
        }
        return
      }
      let list = []
      console.log(`parsedSaveVal is`, savedVal)
      if (isString(savedVal)) {
        this.log(`Found Cache`, savedVal)
        try {
          let parsedList = JSON.parse(savedVal)
          if (isArray(parsedList)) {
            this.log(`parsedvalue is valid`, parsedList)
            list = parsedList
            if (isFunction(this.parser)) {
              list = this.parser(list)
              this.log(`got modified parsed value from parser`, list)
            }
          }
        } catch (e) {}
      }
      cb(null, list)
    })
  }
  save(newVal, cb) {
    this.log(`saving ${this.storageKey} `, newVal)
    this.storage.setItem(this.storageKey, JSON.stringify(newVal), cb)
  }
  add(valueToCache, cb) {
    this.log(`trying to add`, valueToCache)
    this.getParsed((fErr, list) => {
      if (!isNil(fErr)) {
        this.log(`error getting item`, fErr)
        if (isFunction(cb)) {
          cb(fErr)
        }
        return
      }
      let newList = cloneDeep(list)
      this.log(`got cached list`, newList)
      newList.push(valueToCache)
      this.log(`after push list is`, newList)
      this.save(newList, (err) => {
        if (err) {
          this.log(`error saving list`, err)
          if (isFunction(cb)) {
            cb(err)
          }
        } else {
          this.log(`successfully saved new list`, newList)
          if (isFunction(cb)) {
            cb()
          }
        }
      })
    })
  }
  remove(valueToRemove, cb) {
    this.log(`Trying to remove`, valueToRemove)
    this.get((fErr, savedVal) => {
      if (!isNil(fErr)) {
        this.log(`error getting item`, fErr)
        if (isFunction(cb)) {
          cb(fErr)
        }
        return
      }
      let list = []
      if (isString(savedVal)) {
        this.log(`Found Cache`, savedVal)
        let parsedList = JSON.parse(savedVal)
        if (isArray(parsedList)) {
          this.log(`parsedvalue is valid`, parsedList)
          list = parsedList
        }
      }
      pull(list, valueToRemove)
      this.log(`pulled ${JSON.stringify(valueToRemove)}`, list)
      this.save(list, (err) => {
        if (err) {
          this.log(`error saving list`, err)
          if (isFunction(cb)) {
            cb(err)
          }
        } else {
          this.log(`successfully saved new list`)
          if (isFunction(cb)) {
            cb()
          }
        }
      })
    })
  }
  sync(cb) {
    this.log(`Trying to sync`)
    this.get((fErr, savedVal) => {
      if (!isNil(fErr)) {
        this.log(`error getting item`, fErr)
        if (isFunction(cb)) {
          cb(fErr)
        }
        return
      }
      let list = []
      if (isString(savedVal)) {
        this.log(`Found Cache`, savedVal)
        let parsedList = JSON.parse(savedVal)
        if (isArray(parsedList)) {
          this.log(`parsedvalue is valid`, parsedList)
          list = parsedList
        }
      }
      let callbacksNeeded = list.length
      const total = list.length
      this.log(`going to iterate list with ${total} items`)
      if (total === 0) {
        cb()
        return
      }
      each(list, (item) => {
      	this.log(`giving submitter item: `, item)
        this.submitter(item, (err, res) => {
          callbacksNeeded--
          if (isNil(err)) {
            this.log(`no error pulling item ${JSON.stringify(item)}`, list)
            pull(list, item)
            this.log(list)
          } else {
            this.log(`error syncing`, err)
          }
          if (callbacksNeeded === 0) {
            this.save(list, (serr) => {
              if (serr) {
                this.log(`error saving list`, serr)
                if (isFunction(cb)) {
                  cb(serr)
                }
              } else {
                this.log(`successfully saved synced list`, list)
                if (isFunction(cb)) {
                  cb()
                }
              }
            })
          } else {
            cb({
              total: total,
              left: callbacksNeeded
            })
          }
        })
      })
    })
  }
}

export default cUcache
