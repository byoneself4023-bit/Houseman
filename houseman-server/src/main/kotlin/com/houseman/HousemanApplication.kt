package com.houseman

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class HousemanApplication

fun main(args: Array<String>) {
    runApplication<HousemanApplication>(*args)
}
