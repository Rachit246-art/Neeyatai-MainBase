package simulations

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class GetUsersSimulation extends Simulation {

  val httpProtocol = http
    .baseUrl("https://api.example.com") // Base URL for the API
    .acceptHeader("application/json") // Common header for REST APIs
    .contentTypeHeader("application/json") // Common header for REST APIs

  val scn = scenario("Get Users Scenario")
    .exec(http("Get all users") // Name of the request in reports
      .get("/users")) // The specific endpoint to test

  setUp(
    scn.inject(atOnceUsers(100)) // Inject 100 users simultaneously
  ).protocols(httpProtocol) // Apply the defined HTTP protocol
}