import { isNil, isString, isArray, isFunction, pull, each } from 'lodash'

class cUcache {
  constructor() {
    this.storage = null
    this.submitter = null
    this.storageKey = `cache.json`
    this.logToConsole = false
  }
  log(msg) {
    if (this.logToConsole) {
      console.log(msg)
    }
  }
  setStorage(ns) {
    this.storage = ns
  }
  setSubmitter(ns) {
    this.submitter = ns
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
      if (isString(savedVal)) {
        this.log(`Found Cache`, savedVal)
        try {
          let parsedList = JSON.parse(savedVal)
          if (isArray(parsedList)) {
            this.log(`parsedvalue is valid`, parsedList)
            list = parsedList
          }
        } catch(e) {}
      }
      cb(null, list)
    })
  }
  save(newVal, cb) {
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
      this.log(`got cached list`, list)
      list.push(valueToCache)
      this.save(list, (err) => {
        if (err) {
          this.log(`error saving list`, err)
          if (isFunction(cb)) {
            cb(err)
          }
        } else {
          this.log(`successfully saved new list`, list)
          if (isFunction(cb)) {
            cb()
          }
        }
      })
    })
  }
  remove(valueToRemove, cb) {
    this.log(`Trying to remove`, valueToRemove)
    this.get((savedVal) => {
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
      if (total === 0 ) {
        cb()
        return
      }
      each(list, (item) => {
        this.submitter(item, (err, res) => {
          callbacksNeeded--
          if (isNil(err)) {
            this.log(`no error pulling item ${JSON.stringify(item)}`, list)
            pull(list, item)
            this.log(list)
          } else {
            this.log(`error syncing`, err)
          }
          if (callbacksNeeded == 0) {
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
